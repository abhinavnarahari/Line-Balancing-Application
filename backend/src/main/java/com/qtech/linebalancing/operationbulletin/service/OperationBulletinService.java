package com.qtech.linebalancing.operationbulletin.service;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.service.OperationService;
import com.qtech.linebalancing.operationbulletin.dto.BulletinLineRequest;
import com.qtech.linebalancing.operationbulletin.dto.BulletinRequest;
import com.qtech.linebalancing.operationbulletin.dto.BulletinResponse;
import com.qtech.linebalancing.operationbulletin.entity.BulletinLine;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.operationbulletin.repository.OperationBulletinRepository;
import com.qtech.linebalancing.style.entity.Style;
import com.qtech.linebalancing.style.service.StyleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class OperationBulletinService {

    private final OperationBulletinRepository bulletinRepository;
    private final StyleService styleService;
    private final OperationService operationService;

    public List<BulletinResponse> getAll() {
        return bulletinRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    public BulletinResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public BulletinResponse create(BulletinRequest request) {
        if (bulletinRepository.existsByBulletinCodeIgnoreCaseAndVersion(request.getBulletinCode(), request.getVersion())) {
            throw new BusinessRuleException(
                    "Bulletin '" + request.getBulletinCode() + "' version " + request.getVersion() + " already exists.");
        }

        OperationBulletin bulletin = OperationBulletin.builder()
                .bulletinCode(request.getBulletinCode().toUpperCase())
                .name(request.getName())
                .description(request.getDescription())
                .version(request.getVersion())
                .status(request.getStatus())
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .build();

        attachStyles(bulletin, request.getStyleIds());
        buildLines(bulletin, request.getLines());
        bulletin.setTotalSmv(computeTotalSmv(bulletin.getLines()));

        log.info("Creating bulletin '{}' v{} with {} lines, totalSMV={}",
                bulletin.getBulletinCode(), bulletin.getVersion(),
                bulletin.getLines().size(), bulletin.getTotalSmv());
        return toResponse(bulletinRepository.save(bulletin));
    }

    @Transactional
    public BulletinResponse update(Long id, BulletinRequest request) {
        OperationBulletin bulletin = findOrThrow(id);

        if (bulletinRepository.existsByBulletinCodeIgnoreCaseAndVersionAndIdNot(
                request.getBulletinCode(), request.getVersion(), id)) {
            throw new BusinessRuleException(
                    "Bulletin '" + request.getBulletinCode() + "' version " + request.getVersion() + " already exists.");
        }

        bulletin.setBulletinCode(request.getBulletinCode().toUpperCase());
        bulletin.setName(request.getName());
        bulletin.setDescription(request.getDescription());
        bulletin.setVersion(request.getVersion());
        bulletin.setStatus(request.getStatus());
        bulletin.setEffectiveFrom(request.getEffectiveFrom());
        bulletin.setEffectiveTo(request.getEffectiveTo());

        // Replace styles
        bulletin.getStyles().clear();
        attachStyles(bulletin, request.getStyleIds());

        // Replace lines
        bulletin.getLines().clear();
        buildLines(bulletin, request.getLines());
        bulletin.setTotalSmv(computeTotalSmv(bulletin.getLines()));

        return toResponse(bulletinRepository.save(bulletin));
    }

    @Transactional
    public BulletinResponse updateStatus(Long id, OperationBulletin.Status newStatus) {
        OperationBulletin bulletin = findOrThrow(id);
        bulletin.setStatus(newStatus);
        return toResponse(bulletinRepository.save(bulletin));
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void attachStyles(OperationBulletin bulletin, Set<Long> styleIds) {
        if (styleIds == null || styleIds.isEmpty()) return;
        Set<Style> styles = new HashSet<>();
        for (Long styleId : styleIds) {
            styles.add(styleService.findEntityById(styleId));
        }
        bulletin.setStyles(styles);
    }

    private void buildLines(OperationBulletin bulletin, List<BulletinLineRequest> lineRequests) {
        List<BulletinLine> lines = new ArrayList<>();
        for (BulletinLineRequest lineReq : lineRequests) {
            Operation operation = operationService.findEntityById(lineReq.getOperationId());
            BulletinLine line = BulletinLine.builder()
                    .bulletin(bulletin)
                    .sequence(lineReq.getSequence())
                    .operation(operation)
                    .smv(lineReq.getSmv())
                    .machineType(lineReq.getMachineType())
                    .skillRatingRequired(lineReq.getSkillRatingRequired())
                    .notes(lineReq.getNotes())
                    .build();
            lines.add(line);
        }
        bulletin.setLines(lines);
    }

    private BigDecimal computeTotalSmv(List<BulletinLine> lines) {
        return lines.stream()
                .map(BulletinLine::getSmv)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private OperationBulletin findOrThrow(Long id) {
        return bulletinRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OperationBulletin", "id", id));
    }

    private BulletinResponse toResponse(OperationBulletin b) {
        BulletinResponse resp = new BulletinResponse();
        resp.setId(b.getId());
        resp.setBulletinCode(b.getBulletinCode());
        resp.setName(b.getName());
        resp.setDescription(b.getDescription());
        resp.setVersion(b.getVersion());
        resp.setStatus(b.getStatus());
        resp.setEffectiveFrom(b.getEffectiveFrom());
        resp.setEffectiveTo(b.getEffectiveTo());
        resp.setTotalSmv(b.getTotalSmv());
        resp.setCreatedAt(b.getCreatedAt());
        resp.setUpdatedAt(b.getUpdatedAt());

        resp.setStyles(b.getStyles().stream().map(s -> {
            BulletinResponse.StyleSummary ss = new BulletinResponse.StyleSummary();
            ss.setId(s.getId());
            ss.setStyleNo(s.getStyleNo());
            ss.setBuyer(s.getBuyer());
            return ss;
        }).toList());

        resp.setLines(b.getLines().stream().map(line -> {
            BulletinResponse.BulletinLineResponse lr = new BulletinResponse.BulletinLineResponse();
            lr.setId(line.getId());
            lr.setSequence(line.getSequence());
            lr.setOperationId(line.getOperation().getId());
            lr.setOperationCode(line.getOperation().getOperationCode());
            lr.setOperationName(line.getOperation().getName());
            lr.setSmv(line.getSmv());
            lr.setMachineType(line.getMachineType());
            lr.setSkillRatingRequired(line.getSkillRatingRequired());
            lr.setNotes(line.getNotes());
            return lr;
        }).toList());

        return resp;
    }
}
