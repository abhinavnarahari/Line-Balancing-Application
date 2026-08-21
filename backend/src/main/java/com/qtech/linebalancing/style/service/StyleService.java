package com.qtech.linebalancing.style.service;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.style.dto.StyleRequest;
import com.qtech.linebalancing.style.dto.StyleResponse;
import com.qtech.linebalancing.style.entity.Style;
import com.qtech.linebalancing.style.repository.StyleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StyleService {

    private final StyleRepository styleRepository;

    public List<StyleResponse> getAll(Boolean active) {
        List<Style> styles = (active != null)
                ? styleRepository.findByActiveOrderByStyleNoAsc(active)
                : styleRepository.findAllByOrderByStyleNoAsc();
        return styles.stream().map(this::toResponse).toList();
    }

    public StyleResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public StyleResponse create(StyleRequest request) {
        if (styleRepository.existsByStyleNoIgnoreCase(request.getStyleNo())) {
            throw new BusinessRuleException("Style number '" + request.getStyleNo() + "' already exists.");
        }
        Style style = Style.builder()
                .styleNo(request.getStyleNo().toUpperCase())
                .buyer(request.getBuyer())
                .description(request.getDescription())
                .season(request.getSeason())
                .productType(request.getProductType())
                .active(request.isActive())
                .build();
        return toResponse(styleRepository.save(style));
    }

    @Transactional
    public StyleResponse update(Long id, StyleRequest request) {
        Style style = findOrThrow(id);
        if (styleRepository.existsByStyleNoIgnoreCaseAndIdNot(request.getStyleNo(), id)) {
            throw new BusinessRuleException("Style number '" + request.getStyleNo() + "' already exists.");
        }
        style.setStyleNo(request.getStyleNo().toUpperCase());
        style.setBuyer(request.getBuyer());
        style.setDescription(request.getDescription());
        style.setSeason(request.getSeason());
        style.setProductType(request.getProductType());
        style.setActive(request.isActive());
        return toResponse(styleRepository.save(style));
    }

    @Transactional
    public StyleResponse toggleStatus(Long id) {
        Style style = findOrThrow(id);
        style.setActive(!style.isActive());
        return toResponse(styleRepository.save(style));
    }

    public Style findEntityById(Long id) {
        return findOrThrow(id);
    }

    private Style findOrThrow(Long id) {
        return styleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Style", "id", id));
    }

    private StyleResponse toResponse(Style s) {
        StyleResponse resp = new StyleResponse();
        resp.setId(s.getId());
        resp.setStyleNo(s.getStyleNo());
        resp.setBuyer(s.getBuyer());
        resp.setDescription(s.getDescription());
        resp.setSeason(s.getSeason());
        resp.setProductType(s.getProductType());
        resp.setActive(s.isActive());
        resp.setCreatedAt(s.getCreatedAt());
        resp.setUpdatedAt(s.getUpdatedAt());
        return resp;
    }
}
