package com.qtech.linebalancing.operator.dto;

import java.util.List;

/** Where an operator currently works: line plans they are placed on (open orders only) and their current shift. */
public record OperatorPlacementResponse(List<LinePlacement> lines, String currentShift) {

    public record LinePlacement(Long lineId, String lineCode, String lineName, Long orderId, String orderNo,
                                String orderStatus, String planShift, List<String> operations) {}
}
