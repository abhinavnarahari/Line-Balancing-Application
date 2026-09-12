package com.qtech.linebalancing.engine;

import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Precedence Graph Validation Service.
 * Validates operation sequences, dependencies, and detects circular precedence
 * with exact cyclic paths (e.g. Operation 12 -> 18 -> 12).
 */
@Service
public class PrecedenceValidationService {

    @Data
    @Builder
    public static class OperationNode {
        private Long operationId;
        private String operationCode;
        private String operationName;
        private Integer sequence;
        private List<Long> predecessorIds;
    }

    @Data
    @Builder
    public static class PrecedenceValidationResult {
        private boolean isValid;
        private boolean hasCycle;
        private String errorMessage;
        private List<String> cyclePath;
        private List<Long> topologicallySortedOperationIds;
    }

    /**
     * Validates an operation precedence graph and returns topological sort or cycle diagnostics.
     */
    public PrecedenceValidationResult validate(List<OperationNode> nodes) {
        if (nodes == null || nodes.isEmpty()) {
            return PrecedenceValidationResult.builder()
                    .isValid(true)
                    .hasCycle(false)
                    .topologicallySortedOperationIds(Collections.emptyList())
                    .build();
        }

        Map<Long, OperationNode> nodeMap = new HashMap<>();
        Map<Long, List<Long>> adjacencyList = new HashMap<>();
        Map<Long, Integer> inDegree = new HashMap<>();

        for (OperationNode node : nodes) {
            nodeMap.put(node.getOperationId(), node);
            adjacencyList.putIfAbsent(node.getOperationId(), new ArrayList<>());
            inDegree.putIfAbsent(node.getOperationId(), 0);
        }

        // Build directed edges: predecessor -> current
        for (OperationNode node : nodes) {
            if (node.getPredecessorIds() != null) {
                for (Long predId : node.getPredecessorIds()) {
                    if (predId == null) continue;
                    if (!nodeMap.containsKey(predId)) {
                        return PrecedenceValidationResult.builder()
                                .isValid(false)
                                .hasCycle(false)
                                .errorMessage("Operation " + node.getOperationCode() + " references non-existent predecessor ID: " + predId)
                                .build();
                    }
                    if (predId.equals(node.getOperationId())) {
                        return PrecedenceValidationResult.builder()
                                .isValid(false)
                                .hasCycle(true)
                                .errorMessage("Operation " + node.getOperationCode() + " cannot have a self-dependency.")
                                .cyclePath(List.of(node.getOperationCode(), node.getOperationCode()))
                                .build();
                    }
                    adjacencyList.get(predId).add(node.getOperationId());
                    inDegree.put(node.getOperationId(), inDegree.get(node.getOperationId()) + 1);
                }
            }
        }

        // Kahn's Algorithm for Topological Sort & Cycle Detection
        Queue<Long> queue = new LinkedList<>();
        for (Map.Entry<Long, Integer> entry : inDegree.entrySet()) {
            if (entry.getValue() == 0) {
                queue.offer(entry.getKey());
            }
        }

        List<Long> sorted = new ArrayList<>();
        while (!queue.isEmpty()) {
            Long current = queue.poll();
            sorted.add(current);

            for (Long neighbor : adjacencyList.getOrDefault(current, Collections.emptyList())) {
                inDegree.put(neighbor, inDegree.get(neighbor) - 1);
                if (inDegree.get(neighbor) == 0) {
                    queue.offer(neighbor);
                }
            }
        }

        if (sorted.size() == nodes.size()) {
            return PrecedenceValidationResult.builder()
                    .isValid(true)
                    .hasCycle(false)
                    .topologicallySortedOperationIds(sorted)
                    .build();
        }

        // Cycle detected: identify cyclic path using DFS
        List<String> cyclePath = findCyclePath(nodes, adjacencyList);
        String pathStr = String.join(" -> ", cyclePath);

        return PrecedenceValidationResult.builder()
                .isValid(false)
                .hasCycle(true)
                .errorMessage("Circular dependency detected in operation precedence: " + pathStr)
                .cyclePath(cyclePath)
                .build();
    }

    private List<String> findCyclePath(List<OperationNode> nodes, Map<Long, List<Long>> adjacencyList) {
        Map<Long, Integer> visited = new HashMap<>(); // 0=unvisited, 1=visiting, 2=visited
        Map<Long, Long> parent = new HashMap<>();
        Map<Long, String> codeMap = new HashMap<>();
        for (OperationNode n : nodes) {
            codeMap.put(n.getOperationId(), n.getOperationCode() != null ? n.getOperationCode() : "Op#" + n.getOperationId());
        }

        for (OperationNode node : nodes) {
            Long startId = node.getOperationId();
            if (visited.getOrDefault(startId, 0) == 0) {
                List<Long> cycle = dfsCycle(startId, adjacencyList, visited, parent);
                if (cycle != null && !cycle.isEmpty()) {
                    List<String> result = new ArrayList<>();
                    for (Long id : cycle) {
                        result.add(codeMap.getOrDefault(id, "Op#" + id));
                    }
                    return result;
                }
            }
        }
        return List.of("Circular Cycle");
    }

    private List<Long> dfsCycle(Long u, Map<Long, List<Long>> adj, Map<Long, Integer> visited, Map<Long, Long> parent) {
        visited.put(u, 1);
        for (Long v : adj.getOrDefault(u, Collections.emptyList())) {
            if (visited.getOrDefault(v, 0) == 1) {
                // Found cycle from v back to v through u
                List<Long> cycle = new ArrayList<>();
                cycle.add(v);
                Long curr = u;
                while (curr != null && !curr.equals(v)) {
                    cycle.add(curr);
                    curr = parent.get(curr);
                }
                cycle.add(v);
                Collections.reverse(cycle);
                return cycle;
            }
            if (visited.getOrDefault(v, 0) == 0) {
                parent.put(v, u);
                List<Long> cycle = dfsCycle(v, adj, visited, parent);
                if (cycle != null) return cycle;
            }
        }
        visited.put(u, 2);
        return null;
    }
}
