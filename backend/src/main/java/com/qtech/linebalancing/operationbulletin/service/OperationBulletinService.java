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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class OperationBulletinService {

    private final OperationBulletinRepository bulletinRepository;
    private final StyleService styleService;
    private final OperationService operationService;
    private final com.qtech.linebalancing.engine.PrecedenceValidationService precedenceValidationService;

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

        // Validate precedence
        validateLinePrecedence(request.getLines());

        OperationBulletin bulletin = OperationBulletin.builder()
                .bulletinCode(request.getBulletinCode().toUpperCase())
                .name(request.getName())
                .description(request.getDescription())
                .version(request.getVersion())
                .revisionNumber(request.getRevisionNumber() != null ? request.getRevisionNumber() : 1)
                .status(request.getStatus() != null ? request.getStatus() : OperationBulletin.Status.DRAFT)
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .approvedBy(request.getApprovedBy())
                .releasedBy(request.getReleasedBy())
                .build();

        if (request.getParentBulletinId() != null) {
            bulletin.setParentBulletin(findOrThrow(request.getParentBulletinId()));
        }

        attachStyles(bulletin, request.getStyleIds());
        buildLines(bulletin, request.getLines());
        bulletin.setTotalSmv(computeTotalSmv(bulletin.getLines()));

        log.info("Creating bulletin '{}' v{} rev{} with {} lines, totalSMV={}",
                bulletin.getBulletinCode(), bulletin.getVersion(), bulletin.getRevisionNumber(),
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

        // Validate precedence
        validateLinePrecedence(request.getLines());

        bulletin.setBulletinCode(request.getBulletinCode().toUpperCase());
        bulletin.setName(request.getName());
        bulletin.setDescription(request.getDescription());
        bulletin.setVersion(request.getVersion());
        if (request.getRevisionNumber() != null) {
            bulletin.setRevisionNumber(request.getRevisionNumber());
        }
        if (request.getStatus() != null) {
            bulletin.setStatus(request.getStatus());
        }
        bulletin.setEffectiveFrom(request.getEffectiveFrom());
        bulletin.setEffectiveTo(request.getEffectiveTo());

        // Replace styles
        bulletin.getStyles().clear();
        attachStyles(bulletin, request.getStyleIds());

        // Replace lines safely using in-place update & synchronization
        updateLinesInPlace(bulletin, request.getLines());
        bulletin.setTotalSmv(computeTotalSmv(bulletin.getLines()));

        return toResponse(bulletinRepository.save(bulletin));
    }

    @Transactional
    public BulletinResponse updateStatus(Long id, OperationBulletin.Status newStatus, String user) {
        OperationBulletin bulletin = findOrThrow(id);
        bulletin.setStatus(newStatus);
        if (newStatus == OperationBulletin.Status.APPROVED) {
            bulletin.setApprovedBy(user != null ? user : "IE Manager");
            bulletin.setApprovedAt(java.time.LocalDateTime.now());
        } else if (newStatus == OperationBulletin.Status.RELEASED || newStatus == OperationBulletin.Status.PUBLISHED) {
            bulletin.setReleasedBy(user != null ? user : "Plant IE Head");
            bulletin.setReleasedAt(java.time.LocalDateTime.now());
        }
        return toResponse(bulletinRepository.save(bulletin));
    }

    @Transactional
    public BulletinResponse createRevision(Long id) {
        OperationBulletin parent = findOrThrow(id);
        int nextRev = (parent.getRevisionNumber() != null ? parent.getRevisionNumber() : 1) + 1;

        OperationBulletin revision = OperationBulletin.builder()
                .bulletinCode(parent.getBulletinCode())
                .name(parent.getName() + " (Rev " + String.format("%02d", nextRev) + ")")
                .description(parent.getDescription())
                .version(parent.getVersion())
                .revisionNumber(nextRev)
                .parentBulletin(parent)
                .status(OperationBulletin.Status.DRAFT)
                .effectiveFrom(LocalDate.now())
                .totalSmv(parent.getTotalSmv())
                .build();

        // Copy styles
        revision.setStyles(new HashSet<>(parent.getStyles()));

        // Copy lines
        List<BulletinLine> revLines = new ArrayList<>();
        for (BulletinLine srcLine : parent.getLines()) {
            revLines.add(BulletinLine.builder()
                    .bulletin(revision)
                    .sequence(srcLine.getSequence())
                    .operation(srcLine.getOperation())
                    .smv(srcLine.getSmv())
                    .machineType(srcLine.getMachineType())
                    .skillRatingRequired(srcLine.getSkillRatingRequired())
                    .section(srcLine.getSection())
                    .predecessorIds(srcLine.getPredecessorIds())
                    .isParallelizable(srcLine.getIsParallelizable())
                    .splitAllowed(srcLine.getSplitAllowed())
                    .splitType(srcLine.getSplitType())
                    .stitchType(srcLine.getStitchType())
                    .seamType(srcLine.getSeamType())
                    .attachmentType(srcLine.getAttachmentType())
                    .wipThreshold(srcLine.getWipThreshold() != null ? srcLine.getWipThreshold() : 20)
                    .notes(srcLine.getNotes())
                    .build());
        }
        revision.setLines(revLines);

        log.info("Created new revision for bulletin '{}' (Rev {})", parent.getBulletinCode(), nextRev);
        return toResponse(bulletinRepository.save(revision));
    }

    @Transactional
    public void delete(Long id) {
        OperationBulletin bulletin = findOrThrow(id);
        bulletinRepository.delete(bulletin);
        log.info("Deleted operation bulletin '{}' (id={})", bulletin.getBulletinCode(), id);
    }

    @Transactional
    public BulletinResponse cloneBulletin(Long id, String newCode, String newName) {
        OperationBulletin source = findOrThrow(id);

        String targetCode = (newCode != null && !newCode.isBlank())
                ? newCode.trim().toUpperCase()
                : source.getBulletinCode() + "-COPY";
        String targetName = (newName != null && !newName.isBlank())
                ? newName.trim()
                : source.getName() + " (Copy)";
        int targetVersion = 1;

        if (targetCode.equalsIgnoreCase(source.getBulletinCode())) {
            targetVersion = source.getVersion() + 1;
        }

        if (bulletinRepository.existsByBulletinCodeIgnoreCaseAndVersion(targetCode, targetVersion)) {
            targetCode = targetCode + "-" + (System.currentTimeMillis() % 10000);
        }

        OperationBulletin clone = OperationBulletin.builder()
                .bulletinCode(targetCode)
                .name(targetName)
                .description(source.getDescription())
                .version(targetVersion)
                .revisionNumber(1)
                .status(OperationBulletin.Status.DRAFT)
                .effectiveFrom(source.getEffectiveFrom())
                .effectiveTo(source.getEffectiveTo())
                .totalSmv(source.getTotalSmv())
                .build();

        // Copy styles
        clone.setStyles(new HashSet<>(source.getStyles()));

        // Copy lines
        List<BulletinLine> clonedLines = new ArrayList<>();
        for (BulletinLine srcLine : source.getLines()) {
            clonedLines.add(BulletinLine.builder()
                    .bulletin(clone)
                    .sequence(srcLine.getSequence())
                    .operation(srcLine.getOperation())
                    .smv(srcLine.getSmv())
                    .machineType(srcLine.getMachineType())
                    .skillRatingRequired(srcLine.getSkillRatingRequired())
                    .section(srcLine.getSection())
                    .predecessorIds(srcLine.getPredecessorIds())
                    .isParallelizable(srcLine.getIsParallelizable())
                    .splitAllowed(srcLine.getSplitAllowed())
                    .splitType(srcLine.getSplitType())
                    .stitchType(srcLine.getStitchType())
                    .seamType(srcLine.getSeamType())
                    .attachmentType(srcLine.getAttachmentType())
                    .wipThreshold(srcLine.getWipThreshold() != null ? srcLine.getWipThreshold() : 20)
                    .notes(srcLine.getNotes())
                    .build());
        }
        clone.setLines(clonedLines);

        log.info("Cloned bulletin '{}' to '{}' v{} with {} lines",
                source.getBulletinCode(), clone.getBulletinCode(), clone.getVersion(), clone.getLines().size());
        return toResponse(bulletinRepository.save(clone));
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void validateLinePrecedence(List<BulletinLineRequest> lineRequests) {
        if (lineRequests == null || lineRequests.isEmpty()) return;
        List<com.qtech.linebalancing.engine.PrecedenceValidationService.OperationNode> nodes = new ArrayList<>();
        for (BulletinLineRequest lr : lineRequests) {
            List<Long> preds = new ArrayList<>();
            if (lr.getPredecessorIds() != null && !lr.getPredecessorIds().isBlank()) {
                for (String p : lr.getPredecessorIds().split(",")) {
                    try {
                        long pId = Long.parseLong(p.trim());
                        preds.add(pId);
                    } catch (Exception ignored) {}
                }
            }
            nodes.add(com.qtech.linebalancing.engine.PrecedenceValidationService.OperationNode.builder()
                    .operationId(lr.getOperationId())
                    .operationCode("Op#" + lr.getOperationId())
                    .sequence(lr.getSequence())
                    .predecessorIds(preds)
                    .build());
        }
        var validation = precedenceValidationService.validate(nodes);
        if (!validation.isValid()) {
            throw new BusinessRuleException(validation.getErrorMessage());
        }
    }

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
                    .section(lineReq.getSection() != null ? lineReq.getSection() : "MAIN_ASSEMBLY")
                    .predecessorIds(lineReq.getPredecessorIds())
                    .isParallelizable(lineReq.getIsParallelizable() != null ? lineReq.getIsParallelizable() : true)
                    .splitAllowed(lineReq.getSplitAllowed() != null ? lineReq.getSplitAllowed() : false)
                    .splitType(lineReq.getSplitType() != null ? lineReq.getSplitType() : "NONE")
                    .stitchType(lineReq.getStitchType())
                    .seamType(lineReq.getSeamType())
                    .attachmentType(lineReq.getAttachmentType())
                    .wipThreshold(lineReq.getWipThreshold() != null ? lineReq.getWipThreshold() : 20)
                    .notes(lineReq.getNotes())
                    .build();
            lines.add(line);
        }
        bulletin.setLines(lines);
    }

    private void updateLinesInPlace(OperationBulletin bulletin, List<BulletinLineRequest> lineRequests) {
        if (lineRequests == null || lineRequests.isEmpty()) {
            bulletin.getLines().clear();
            return;
        }

        Map<Integer, BulletinLine> existingBySeq = bulletin.getLines().stream()
                .collect(Collectors.toMap(BulletinLine::getSequence, Function.identity(), (a, b) -> a));

        List<BulletinLine> updatedLines = new ArrayList<>();
        for (BulletinLineRequest req : lineRequests) {
            Operation operation = operationService.findEntityById(req.getOperationId());
            BulletinLine existing = existingBySeq.remove(req.getSequence());
            if (existing != null) {
                existing.setOperation(operation);
                existing.setSmv(req.getSmv());
                existing.setMachineType(req.getMachineType());
                existing.setSkillRatingRequired(req.getSkillRatingRequired());
                existing.setSection(req.getSection() != null ? req.getSection() : "MAIN_ASSEMBLY");
                existing.setPredecessorIds(req.getPredecessorIds());
                existing.setIsParallelizable(req.getIsParallelizable() != null ? req.getIsParallelizable() : true);
                existing.setSplitAllowed(req.getSplitAllowed() != null ? req.getSplitAllowed() : false);
                existing.setSplitType(req.getSplitType() != null ? req.getSplitType() : "NONE");
                existing.setStitchType(req.getStitchType());
                existing.setSeamType(req.getSeamType());
                existing.setAttachmentType(req.getAttachmentType());
                existing.setWipThreshold(req.getWipThreshold() != null ? req.getWipThreshold() : (existing.getWipThreshold() != null ? existing.getWipThreshold() : 20));
                existing.setNotes(req.getNotes());
                updatedLines.add(existing);
            } else {
                BulletinLine newLine = BulletinLine.builder()
                        .bulletin(bulletin)
                        .sequence(req.getSequence())
                        .operation(operation)
                        .smv(req.getSmv())
                        .machineType(req.getMachineType())
                        .skillRatingRequired(req.getSkillRatingRequired())
                        .section(req.getSection() != null ? req.getSection() : "MAIN_ASSEMBLY")
                        .predecessorIds(req.getPredecessorIds())
                        .isParallelizable(req.getIsParallelizable() != null ? req.getIsParallelizable() : true)
                        .splitAllowed(req.getSplitAllowed() != null ? req.getSplitAllowed() : false)
                        .splitType(req.getSplitType() != null ? req.getSplitType() : "NONE")
                        .stitchType(req.getStitchType())
                        .seamType(req.getSeamType())
                        .attachmentType(req.getAttachmentType())
                        .wipThreshold(req.getWipThreshold() != null ? req.getWipThreshold() : 20)
                        .notes(req.getNotes())
                        .build();
                updatedLines.add(newLine);
            }
        }

        bulletin.getLines().clear();
        bulletin.getLines().addAll(updatedLines);
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
        resp.setRevisionNumber(b.getRevisionNumber() != null ? b.getRevisionNumber() : 1);
        resp.setParentBulletinId(b.getParentBulletin() != null ? b.getParentBulletin().getId() : null);
        resp.setStatus(b.getStatus());
        resp.setApprovedBy(b.getApprovedBy());
        resp.setApprovedAt(b.getApprovedAt());
        resp.setReleasedBy(b.getReleasedBy());
        resp.setReleasedAt(b.getReleasedAt());
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
            lr.setSection(line.getSection());
            lr.setPredecessorIds(line.getPredecessorIds());
            lr.setIsParallelizable(line.getIsParallelizable());
            lr.setSplitAllowed(line.getSplitAllowed());
            lr.setSplitType(line.getSplitType());
            lr.setStitchType(line.getStitchType());
            lr.setSeamType(line.getSeamType());
            lr.setAttachmentType(line.getAttachmentType());
            lr.setWipThreshold(line.getWipThreshold() != null ? line.getWipThreshold() : 20);
            lr.setNotes(line.getNotes());
            return lr;
        }).toList());

        return resp;
    }
}
