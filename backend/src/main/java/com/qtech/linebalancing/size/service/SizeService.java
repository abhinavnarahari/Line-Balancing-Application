package com.qtech.linebalancing.size.service;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.size.dto.SizeRequest;
import com.qtech.linebalancing.size.dto.SizeResponse;
import com.qtech.linebalancing.size.entity.Size;
import com.qtech.linebalancing.size.repository.SizeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class SizeService {

    private final SizeRepository sizeRepository;

    public List<SizeResponse> getAll(Boolean active) {
        List<Size> sizes = (active != null)
                ? sizeRepository.findByActiveOrderBySequenceAsc(active)
                : sizeRepository.findAllByOrderBySequenceAsc();
        return sizes.stream().map(this::toResponse).toList();
    }

    public SizeResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public SizeResponse create(SizeRequest request) {
        if (sizeRepository.existsByCodeIgnoreCase(request.getCode())) {
            throw new BusinessRuleException("Size code '" + request.getCode() + "' already exists.");
        }
        Size size = Size.builder()
                .code(request.getCode().toUpperCase())
                .label(request.getLabel())
                .sequence(request.getSequence())
                .active(request.isActive())
                .build();
        return toResponse(sizeRepository.save(size));
    }

    @Transactional
    public SizeResponse update(Long id, SizeRequest request) {
        Size size = findOrThrow(id);
        if (sizeRepository.existsByCodeIgnoreCaseAndIdNot(request.getCode(), id)) {
            throw new BusinessRuleException("Size code '" + request.getCode() + "' already exists.");
        }
        size.setCode(request.getCode().toUpperCase());
        size.setLabel(request.getLabel());
        size.setSequence(request.getSequence());
        size.setActive(request.isActive());
        return toResponse(sizeRepository.save(size));
    }

    @Transactional
    public SizeResponse toggleStatus(Long id) {
        Size size = findOrThrow(id);
        size.setActive(!size.isActive());
        return toResponse(sizeRepository.save(size));
    }

    public Size findEntityById(Long id) {
        return findOrThrow(id);
    }

    private Size findOrThrow(Long id) {
        return sizeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Size", "id", id));
    }

    private SizeResponse toResponse(Size s) {
        SizeResponse resp = new SizeResponse();
        resp.setId(s.getId());
        resp.setCode(s.getCode());
        resp.setLabel(s.getLabel());
        resp.setSequence(s.getSequence());
        resp.setActive(s.isActive());
        resp.setCreatedAt(s.getCreatedAt());
        resp.setUpdatedAt(s.getUpdatedAt());
        return resp;
    }
}
