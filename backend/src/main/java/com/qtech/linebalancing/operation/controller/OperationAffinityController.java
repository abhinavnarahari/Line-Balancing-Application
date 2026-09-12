package com.qtech.linebalancing.operation.controller;

import com.qtech.linebalancing.operation.dto.OperationAffinityRequest;
import com.qtech.linebalancing.operation.dto.OperationAffinityResponse;
import com.qtech.linebalancing.operation.service.OperationAffinityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/operations")
@RequiredArgsConstructor
public class OperationAffinityController {

    private final OperationAffinityService affinityService;

    @GetMapping("/{id}/affinities")
    public ResponseEntity<List<OperationAffinityResponse>> getAffinitiesForOperation(@PathVariable Long id) {
        return ResponseEntity.ok(affinityService.getAffinitiesForOperation(id));
    }

    @GetMapping("/affinities/all")
    public ResponseEntity<List<OperationAffinityResponse>> getAllAffinities() {
        return ResponseEntity.ok(affinityService.getAllAffinities());
    }

    @PostMapping("/{id}/affinities")
    public ResponseEntity<OperationAffinityResponse> addAffinity(
            @PathVariable Long id,
            @Valid @RequestBody OperationAffinityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(affinityService.createOrUpdateAffinity(id, request));
    }

    @DeleteMapping("/affinities/{affinityId}")
    public ResponseEntity<Void> deleteAffinity(@PathVariable Long affinityId) {
        affinityService.deleteAffinity(affinityId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{primaryId}/affinities/{altId}")
    public ResponseEntity<Void> deleteAffinityPair(
            @PathVariable Long primaryId,
            @PathVariable Long altId) {
        affinityService.deleteAffinityPair(primaryId, altId);
        return ResponseEntity.noContent().build();
    }
}
