package com.qtech.linebalancing.linebalance.service;

import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.engine.LineBalanceCalculationService;
import com.qtech.linebalancing.engine.MultiObjectiveOptimizerService;
import com.qtech.linebalancing.linebalance.dto.BalanceDetailResponse;
import com.qtech.linebalancing.linebalance.dto.BalanceSaveRequest;
import com.qtech.linebalancing.linebalance.entity.*;
import com.qtech.linebalancing.linebalance.repository.*;
import com.qtech.linebalancing.linedesign.entity.LineDesign;
import com.qtech.linebalancing.linedesign.repository.LineDesignRepository;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.repository.OperationRepository;
import com.qtech.linebalancing.operationbulletin.entity.BulletinLine;
import com.qtech.linebalancing.operationbulletin.repository.BulletinLineRepository;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LineBalanceService {

    private final LineDesignRepository lineDesignRepository;
    private final BalanceWorkstationRepository balanceWorkstationRepository;
    private final BalanceStationOperationRepository balanceStationOperationRepository;
    private final OperatorStationPlacementRepository operatorStationPlacementRepository;
    private final OptimizationRecommendationRepository recommendationRepository;
    private final OperationRepository operationRepository;
    private final BulletinLineRepository bulletinLineRepository;
    private final OperatorRepository operatorRepository;

    private final LineBalanceCalculationService lineBalanceCalculationService;
    private final MultiObjectiveOptimizerService multiObjectiveOptimizerService;

    public BalanceDetailResponse getBalanceByDesignId(Long lineDesignId) {
        LineDesign design = lineDesignRepository.findById(lineDesignId)
                .orElseThrow(() -> new ResourceNotFoundException("LineDesign", "id", lineDesignId));

        List<BalanceWorkstation> stations = balanceWorkstationRepository.findByLineDesignIdOrderByStationIndexAsc(lineDesignId);
        List<OperatorStationPlacement> placements = operatorStationPlacementRepository.findByLineDesignId(lineDesignId);
        List<OptimizationRecommendation> recs = recommendationRepository.findByLineDesignId(lineDesignId);

        return mapToDetailResponse(design, stations, placements, recs);
    }

    @Transactional
    public BalanceDetailResponse saveBalance(BalanceSaveRequest req) {
        LineDesign design = lineDesignRepository.findById(req.getLineDesignId())
                .orElseThrow(() -> new ResourceNotFoundException("LineDesign", "id", req.getLineDesignId()));

        // Remove old workstation allocations
        List<BalanceWorkstation> oldStations = balanceWorkstationRepository.findByLineDesignIdOrderByStationIndexAsc(design.getId());
        balanceWorkstationRepository.deleteAll(oldStations);

        List<OperatorStationPlacement> oldPlacements = operatorStationPlacementRepository.findByLineDesignId(design.getId());
        operatorStationPlacementRepository.deleteAll(oldPlacements);

        List<BalanceWorkstation> savedStations = new ArrayList<>();
        Map<Integer, BalanceWorkstation> stationMap = new HashMap<>();

        if (req.getWorkstations() != null) {
            for (BalanceSaveRequest.WorkstationSaveDTO stDto : req.getWorkstations()) {
                BalanceWorkstation ws = BalanceWorkstation.builder()
                        .lineDesign(design)
                        .stationIndex(stDto.getStationIndex())
                        .stationCode(stDto.getStationCode() != null ? stDto.getStationCode() : "S" + String.format("%02d", stDto.getStationIndex()))
                        .primaryMachineType(stDto.getPrimaryMachineType())
                        .allocatedOperators(stDto.getAllocatedOperators() != null ? stDto.getAllocatedOperators() : 1)
                        .effectiveTimeSecs(stDto.getEffectiveTimeSecs() != null ? stDto.getEffectiveTimeSecs() : 0.0)
                        .capacityPerHour(stDto.getCapacityPerHour() != null ? stDto.getCapacityPerHour() : 0.0)
                        .workloadPercent(stDto.getWorkloadPercent() != null ? stDto.getWorkloadPercent() : 0.0)
                        .isBottleneck(stDto.getIsBottleneck() != null ? stDto.getIsBottleneck() : false)
                        .build();

                if (stDto.getOperations() != null) {
                    for (BalanceSaveRequest.StationOperationSaveDTO opDto : stDto.getOperations()) {
                        Operation op = operationRepository.findById(opDto.getOperationId()).orElse(null);
                        if (op == null) continue;

                        BulletinLine bLine = opDto.getBulletinLineId() != null
                                ? bulletinLineRepository.findById(opDto.getBulletinLineId()).orElse(null)
                                : null;

                        ws.addOperation(BalanceStationOperation.builder()
                                .operation(op)
                                .bulletinLine(bLine)
                                .sequence(opDto.getSequence() != null ? opDto.getSequence() : 1)
                                .operationSmv(opDto.getOperationSmv() != null ? opDto.getOperationSmv() : 0.0)
                                .machineType(opDto.getMachineType())
                                .isSplit(opDto.getIsSplit() != null ? opDto.getIsSplit() : false)
                                .splitRatio(opDto.getSplitRatio() != null ? opDto.getSplitRatio() : 1.0)
                                .isQcCheckpoint(opDto.getIsQcCheckpoint() != null ? opDto.getIsQcCheckpoint() : false)
                                .build());
                    }
                }

                BalanceWorkstation savedWs = balanceWorkstationRepository.save(ws);
                savedStations.add(savedWs);
                stationMap.put(savedWs.getStationIndex(), savedWs);
            }
        }

        // Save Operator Placements
        List<OperatorStationPlacement> savedPlacements = new ArrayList<>();
        if (req.getOperatorPlacements() != null) {
            for (BalanceSaveRequest.OperatorPlacementSaveDTO plDto : req.getOperatorPlacements()) {
                BalanceWorkstation ws = stationMap.get(plDto.getStationIndex());
                if (ws == null) continue;

                Operator operator = plDto.getOperatorId() != null
                        ? operatorRepository.findById(plDto.getOperatorId()).orElse(null)
                        : null;

                OperatorStationPlacement placement = OperatorStationPlacement.builder()
                        .lineDesign(design)
                        .balanceWorkstation(ws)
                        .operator(operator)
                        .requiredSkillLevel(plDto.getRequiredSkillLevel() != null ? plDto.getRequiredSkillLevel() : 3)
                        .actualSkillLevel(plDto.getActualSkillLevel())
                        .matchStatus(plDto.getMatchStatus() != null ? plDto.getMatchStatus() : "MATCH")
                        .notes(plDto.getNotes())
                        .build();

                savedPlacements.add(operatorStationPlacementRepository.save(placement));
            }
        }

        // Update Line Design status to BALANCED
        design.setTotalWorkstations(savedStations.size());
        int totalOps = savedStations.stream().mapToInt(BalanceWorkstation::getAllocatedOperators).sum();
        design.setTotalOperators(Math.max(totalOps, 1));
        if ("DRAFT".equalsIgnoreCase(design.getStatus())) {
            design.setStatus("BALANCED");
        }
        lineDesignRepository.save(design);

        List<OptimizationRecommendation> recs = recommendationRepository.findByLineDesignId(design.getId());
        return mapToDetailResponse(design, savedStations, savedPlacements, recs);
    }

    @Transactional
    public BalanceDetailResponse runOptimization(Long lineDesignId) {
        LineDesign design = lineDesignRepository.findById(lineDesignId)
                .orElseThrow(() -> new ResourceNotFoundException("LineDesign", "id", lineDesignId));

        if (design.getBulletin() == null) {
            return getBalanceByDesignId(lineDesignId);
        }

        List<MultiObjectiveOptimizerService.CandidateOperation> candidateOps = new ArrayList<>();
        for (BulletinLine bl : design.getBulletin().getLines()) {
            List<Long> preds = new ArrayList<>();
            if (bl.getPredecessorIds() != null && !bl.getPredecessorIds().isBlank()) {
                for (String p : bl.getPredecessorIds().split(",")) {
                    try { preds.add(Long.parseLong(p.trim())); } catch (Exception ignored) {}
                }
            }

            candidateOps.add(MultiObjectiveOptimizerService.CandidateOperation.builder()
                    .operationId(bl.getOperation().getId())
                    .bulletinLineId(bl.getId())
                    .operationCode(bl.getOperation().getOperationCode())
                    .operationName(bl.getOperation().getName())
                    .section(bl.getSection())
                    .machineType(bl.getMachineType())
                    .standardSmvMinutes(bl.getSmv().doubleValue())
                    .sequence(bl.getSequence())
                    .predecessorIds(preds)
                    .isParallelizable(bl.getIsParallelizable() != null ? bl.getIsParallelizable() : true)
                    .splitAllowed(bl.getSplitAllowed() != null ? bl.getSplitAllowed() : false)
                    .splitType(bl.getSplitType())
                    .requiredSkillLevel(bl.getSkillRatingRequired())
                    .build());
        }

        double takt = design.getTargetHourlyOutput() > 0 ? (3600.0 / design.getTargetHourlyOutput()) : 51.43;
        double reqCap = design.getPlannedEfficiency() > 0 ? (design.getTargetHourlyOutput() / (design.getPlannedEfficiency() / 100.0)) : design.getTargetHourlyOutput();
        double pitch = reqCap > 0 ? (3600.0 / reqCap) : 41.14;

        var optResult = multiObjectiveOptimizerService.optimize(
                MultiObjectiveOptimizerService.OptimizationRequest.builder()
                        .operations(candidateOps)
                        .designedPitchSecs(pitch)
                        .requiredDesignCapacity(reqCap)
                        .customerTaktSecs(takt)
                        .maxAllowedWorkstations(30)
                        .build()
        );

        // Save recommendations to database
        recommendationRepository.deleteAll(recommendationRepository.findByLineDesignId(design.getId()));
        List<OptimizationRecommendation> savedRecs = new ArrayList<>();

        for (var recDto : optResult.getRecommendations()) {
            savedRecs.add(recommendationRepository.save(OptimizationRecommendation.builder()
                    .lineDesign(design)
                    .strategyType(recDto.getStrategyType())
                    .title(recDto.getTitle())
                    .reason(recDto.getReason())
                    .currentCycleTimeSecs(recDto.getCurrentCycleTimeSecs())
                    .projectedCycleTimeSecs(recDto.getProjectedCycleTimeSecs())
                    .projectedCapacityPerHour(recDto.getProjectedCapacityPerHour())
                    .status("PROPOSED")
                    .build()));
        }

        return getBalanceByDesignId(lineDesignId);
    }

    private BalanceDetailResponse mapToDetailResponse(
            LineDesign design,
            List<BalanceWorkstation> stations,
            List<OperatorStationPlacement> placements,
            List<OptimizationRecommendation> recs) {

        BalanceDetailResponse r = new BalanceDetailResponse();
        r.setLineDesignId(design.getId());
        r.setDesignCode(design.getDesignCode());
        r.setOrderNo(design.getOrder().getOrderNo());
        if (design.getOrder().getStyle() != null) {
            r.setStyleNo(design.getOrder().getStyle().getStyleNo());
        }
        if (design.getLine() != null) {
            r.setLineName(design.getLine().getLineName());
        }
        if (design.getShift() != null) {
            r.setShiftName(design.getShift().getShiftName());
        }
        r.setTargetHourlyOutput(design.getTargetHourlyOutput());
        r.setPlannedEfficiency(design.getPlannedEfficiency());

        double takt = design.getTargetHourlyOutput() > 0 ? (3600.0 / design.getTargetHourlyOutput()) : 51.43;
        r.setCustomerTaktSecs(takt);
        r.setDesignedPitchSecs(design.getDesignedPitchSecs());
        r.setLineBalanceEfficiency(design.getLineBalanceEfficiency());
        r.setTotalWorkstations(stations.size());
        r.setTotalOperators(stations.stream().mapToInt(BalanceWorkstation::getAllocatedOperators).sum());
        r.setBottleneckCount((int) stations.stream().filter(BalanceWorkstation::getIsBottleneck).count());

        r.setWorkstations(stations.stream().map(ws -> {
            BalanceDetailResponse.WorkstationDetailDTO wDto = new BalanceDetailResponse.WorkstationDetailDTO();
            wDto.setId(ws.getId());
            wDto.setStationIndex(ws.getStationIndex());
            wDto.setStationCode(ws.getStationCode());
            wDto.setPrimaryMachineType(ws.getPrimaryMachineType());
            wDto.setAllocatedOperators(ws.getAllocatedOperators());
            wDto.setEffectiveTimeSecs(ws.getEffectiveTimeSecs());
            wDto.setCapacityPerHour(ws.getCapacityPerHour());
            wDto.setWorkloadPercent(ws.getWorkloadPercent());
            wDto.setIsBottleneck(ws.getIsBottleneck());

            wDto.setOperations(ws.getOperations().stream().map(op -> {
                BalanceDetailResponse.StationOperationDetailDTO opDto = new BalanceDetailResponse.StationOperationDetailDTO();
                opDto.setId(op.getId());
                opDto.setOperationId(op.getOperation().getId());
                opDto.setOperationCode(op.getOperation().getOperationCode());
                opDto.setOperationName(op.getOperation().getName());
                if (op.getBulletinLine() != null) {
                    opDto.setBulletinLineId(op.getBulletinLine().getId());
                }
                opDto.setSequence(op.getSequence());
                opDto.setOperationSmv(op.getOperationSmv());
                opDto.setMachineType(op.getMachineType());
                opDto.setIsSplit(op.getIsSplit());
                opDto.setSplitRatio(op.getSplitRatio());
                opDto.setIsQcCheckpoint(op.getIsQcCheckpoint());
                return opDto;
            }).toList());

            return wDto;
        }).toList());

        r.setOperatorPlacements(placements.stream().map(pl -> {
            BalanceDetailResponse.OperatorPlacementDetailDTO pDto = new BalanceDetailResponse.OperatorPlacementDetailDTO();
            pDto.setId(pl.getId());
            pDto.setStationIndex(pl.getBalanceWorkstation().getStationIndex());
            pDto.setStationCode(pl.getBalanceWorkstation().getStationCode());
            if (pl.getOperator() != null) {
                pDto.setOperatorId(pl.getOperator().getId());
                pDto.setOperatorName(pl.getOperator().getName());
                pDto.setOperatorCode(pl.getOperator().getEmployeeId());
            }
            pDto.setRequiredSkillLevel(pl.getRequiredSkillLevel());
            pDto.setActualSkillLevel(pl.getActualSkillLevel());
            pDto.setMatchStatus(pl.getMatchStatus());
            pDto.setNotes(pl.getNotes());
            return pDto;
        }).toList());

        r.setRecommendations(recs.stream().map(rec -> {
            BalanceDetailResponse.OptimizationRecommendationDTO rDto = new BalanceDetailResponse.OptimizationRecommendationDTO();
            rDto.setId(rec.getId());
            if (rec.getBalanceWorkstation() != null) {
                rDto.setStationIndex(rec.getBalanceWorkstation().getStationIndex());
            }
            rDto.setStrategyType(rec.getStrategyType());
            rDto.setTitle(rec.getTitle());
            rDto.setReason(rec.getReason());
            rDto.setCurrentCycleTimeSecs(rec.getCurrentCycleTimeSecs());
            rDto.setProjectedCycleTimeSecs(rec.getProjectedCycleTimeSecs());
            rDto.setProjectedCapacityPerHour(rec.getProjectedCapacityPerHour());
            rDto.setStatus(rec.getStatus());
            return rDto;
        }).toList());

        return r;
    }
}
