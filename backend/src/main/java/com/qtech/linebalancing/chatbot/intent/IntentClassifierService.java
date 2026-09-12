package com.qtech.linebalancing.chatbot.intent;

import com.qtech.linebalancing.chatbot.dto.ChatContextDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class IntentClassifierService {

    private static final Pattern LINE_PATTERN = Pattern.compile("(?i)(?:line[\\s-_]*0?([1-9]|10|20)|l-0?([1-9]|10|20)|line\\s+(one|two|three|four|five|six|seven|eight|nine|ten))");
    private static final Pattern WRITE_ACTION_PATTERN = Pattern.compile("(?i)\\b(delete|drop|remove|update|change|modify|create|insert|assign|rebalance|approve|release|set|reset)\\b");
    private static final Pattern OUT_OF_SCOPE_PATTERN = Pattern.compile("(?i)\\b(weather|stock market|bitcoin|crypto|president|recipe|movie|song|google|vietnam|bangladesh|history of|who is the king)\\b");

    public record ClassificationResult(ChatIntent intent, ExtractedEntities entities) {}

    public ClassificationResult classify(String message, ChatContextDto context) {
        String lower = message.trim().toLowerCase();
        ExtractedEntities entities = extractEntities(message, context);

        // 1. Guardrail: Reject write/mutation requests
        if (WRITE_ACTION_PATTERN.matcher(lower).find() && (lower.contains("line") || lower.contains("station") || lower.contains("operator") || lower.contains("order") || lower.contains("style"))) {
            return new ClassificationResult(ChatIntent.READ_ONLY_GUARDRAIL, entities);
        }

        // 2. Guardrail: Out of application scope questions
        if (OUT_OF_SCOPE_PATTERN.matcher(lower).find() && !lower.contains("smv") && !lower.contains("line") && !lower.contains("operator") && !lower.contains("style")) {
            return new ClassificationResult(ChatIntent.OUT_OF_SCOPE, entities);
        }

        // 3. Ambiguity Checks
        // 3. Ambiguity Checks
        if (lower.matches(".*\\b(what is the efficiency|show efficiency|current efficiency|how is efficiency)\\b.*") && !lower.contains("actual") && !lower.contains("planned") && !lower.contains("balance") && !lower.contains("line balance") && !lower.contains("operator")) {
            return new ClassificationResult(ChatIntent.AMBIGUOUS_EFFICIENCY, entities);
        }

        // 3.1. IE Formula & Educational Definitions
        if (lower.contains("formula") || lower.contains("how is takt calculated") || lower.contains("how is pitch calculated") || lower.contains("how is lbe calculated") || lower.contains("how to calculate") || lower.contains("explain formula") || lower.contains("what is pfd") || lower.contains("difference between takt") || lower.contains("difference between planned")) {
            return new ClassificationResult(ChatIntent.EXPLAIN_IE_FORMULA, entities);
        }

        // 3.2. Optimization & Rebalancing Recommendations
        if (lower.contains("optimize") || lower.contains("optimization") || lower.contains("rebalance") || lower.contains("recommendation") || lower.contains("suggestions to improve") || lower.contains("how to improve balance") || lower.contains("how to improve efficiency")) {
            return new ClassificationResult(ChatIntent.OPTIMIZATION_RECOMMENDATIONS, entities);
        }

        // 3.3. Shift Timings & Working Hours
        if (lower.contains("shift timing") || lower.contains("shift hours") || lower.contains("shift schedule") || lower.contains("break duration") || (lower.contains("shift") && (lower.contains("details") || lower.contains("time") || lower.contains("config")))) {
            return new ClassificationResult(ChatIntent.GET_SHIFT_DETAILS, entities);
        }

        // 4. Comparison & Analytics Queries
        if (lower.contains("compare") && lower.contains("line")) {
            return new ClassificationResult(ChatIntent.COMPARE_LINES, entities);
        }
        if (lower.contains("why is") && (lower.contains("behind") || lower.contains("below target") || lower.contains("low output") || lower.contains("gap"))) {
            return new ClassificationResult(ChatIntent.EXPLAIN_PRODUCTION_GAP, entities);
        }
        if (lower.contains("behind target") || lower.contains("below target") || (lower.contains("target vs actual") || lower.contains("variance"))) {
            return new ClassificationResult(ChatIntent.COMPARE_TARGET_VS_ACTUAL, entities);
        }

        // 5. Bottleneck Queries
        if (lower.contains("bottleneck") || lower.contains("pacing station") || lower.contains("slowest station") || lower.contains("overloaded station") || lower.contains("slowest operation") || lower.contains("identify bottleneck")) {
            return new ClassificationResult(ChatIntent.GET_BOTTLENECK_STATION, entities);
        }

        // 6. Capacity, Takt & Pitch Queries
        if (lower.contains("takt") || lower.contains("customer takt")) {
            return new ClassificationResult(ChatIntent.GET_TAKT_TIME, entities);
        }
        if (lower.contains("pitch") || lower.contains("design pitch") || lower.contains("pitch time")) {
            return new ClassificationResult(ChatIntent.GET_DESIGNED_PITCH, entities);
        }
        if ((lower.contains("capacity") && (lower.contains("plan") || lower.contains("required") || lower.contains("design cap"))) || lower.contains("run rate")) {
            return new ClassificationResult(ChatIntent.GET_REQUIRED_CAPACITY, entities);
        }
        if (lower.contains("planned manpower") || lower.contains("how many operators are required") || lower.contains("required operators") || lower.contains("manpower required")) {
            return new ClassificationResult(ChatIntent.GET_PLANNED_MANPOWER, entities);
        }
        if (lower.contains("capacity plan")) {
            return new ClassificationResult(ChatIntent.GET_CAPACITY_PLAN, entities);
        }

        // 7. Station Load (before general line balance check)
        if (lower.contains("station load") || lower.contains("workstation load") || lower.contains("station allocation")) {
            return new ClassificationResult(ChatIntent.GET_STATION_LOAD, entities);
        }

        // 7a. Line Balance & Workstation Queries
        if (lower.contains("line balance") || lower.contains("line balancing") || lower.contains("yamazumi")) {
            if (lower.contains("efficiency") || lower.contains("lbe")) {
                return new ClassificationResult(ChatIntent.GET_LINE_BALANCE_EFFICIENCY, entities);
            }
            return new ClassificationResult(ChatIntent.GET_LINE_BALANCE, entities);
        }
        if (lower.contains("lbe") || lower.contains("balance efficiency")) {
            return new ClassificationResult(ChatIntent.GET_LINE_BALANCE_EFFICIENCY, entities);
        }

        // 7b. Machines assigned to a specific line
        if ((lower.contains("machine") && lower.contains("line")) ||
            lower.contains("machines on line") || lower.contains("what machines does") ||
            lower.contains("machines assigned") || lower.contains("line machines") ||
            lower.contains("equipment on line")) {
            return new ClassificationResult(ChatIntent.GET_LINE_MACHINES, entities);
        }

        // 8. Operation, SMV & Machine Requirement Queries
        if (lower.contains("parallelizable") || lower.contains("split allowed") || lower.contains("split type") || lower.contains("stitch type") || lower.contains("seam type") || lower.contains("attachment")) {
            return new ClassificationResult(ChatIntent.GET_OPERATION_ATTRIBUTES, entities);
        }
        if (lower.contains("machine is used") || lower.contains("machine used for") || lower.contains("which machine for") || lower.contains("equipment for")) {
            return new ClassificationResult(ChatIntent.GET_OPERATION_MACHINE, entities);
        }
        if (lower.contains("predecessor") || lower.contains("sequence of") || lower.contains("comes before")) {
            return new ClassificationResult(ChatIntent.GET_OPERATION_PREDECESSORS, entities);
        }
        if (lower.contains("smv") || lower.contains("standard minute") || lower.contains("sam") || lower.contains("cycle time of") || lower.contains("time for")) {
            if (lower.contains("total") || lower.contains("garment") || (lower.contains("style") && !lower.contains("operation"))) {
                return new ClassificationResult(ChatIntent.GET_STYLE_TOTAL_SMV, entities);
            }
            return new ClassificationResult(ChatIntent.GET_OPERATION_SMV, entities);
        }
        if (lower.contains("all operations") || lower.contains("list operations") || lower.contains("show operations")) {
            return new ClassificationResult(ChatIntent.GET_STYLE_OPERATIONS, entities);
        }
        if (lower.contains("operation") && (lower.contains("details") || lower.contains("about") || lower.contains("info"))) {
            return new ClassificationResult(ChatIntent.GET_OPERATION_DETAILS, entities);
        }
        if (lower.contains("bulletin") || lower.contains("ob")) {
            return new ClassificationResult(ChatIntent.GET_OB_DETAILS, entities);
        }

        // 9. Operator & Skill Queries
        if ((lower.contains("how many operators") || lower.contains("operator count") || lower.contains("total operators") || lower.contains("manpower")) && (lower.contains("line") || lower.contains("assigned") || lower.contains("plant") || lower.contains("have"))) {
            return new ClassificationResult(ChatIntent.GET_LINE_MANPOWER, entities);
        }
        if (lower.contains("which operators are assigned") || lower.contains("who is assigned") || lower.contains("assigned to the") || lower.contains("assigned to")) {
            return new ClassificationResult(ChatIntent.GET_OPERATOR_ASSIGNMENT, entities);
        }
        if (lower.contains("skill") || lower.contains("matrix") || lower.contains("rating of") || lower.contains("can do") || lower.contains("qualified for") || lower.contains("can perform") || lower.contains("who can sew") || lower.contains("who can stitch") || lower.contains("trained in")) {
            return new ClassificationResult(ChatIntent.GET_OPERATOR_SKILL, entities);
        }
        if (lower.contains("attendance") || lower.contains("absent") || lower.contains("present today") || lower.contains("who is present") || lower.contains("who came today") || lower.contains("absentee")) {
            return new ClassificationResult(ChatIntent.GET_OPERATOR_ATTENDANCE, entities);
        }
        if (lower.contains("operator") && (lower.contains("details") || lower.contains("profile") || lower.contains("who is"))) {
            return new ClassificationResult(ChatIntent.GET_OPERATOR_DETAILS, entities);
        }

        // 10. Machine Inventory Queries
        if (lower.contains("machine inventory") || lower.contains("sewing machines") || lower.contains("how many machines") || lower.contains("available machines") || lower.contains("all machines")) {
            return new ClassificationResult(ChatIntent.GET_MACHINE_INVENTORY, entities);
        }

        // 11. Production, Hourly & Output Queries
        if (lower.contains("today's production") || lower.contains("today production") || lower.contains("production today") || lower.contains("current production") || lower.contains("production output") || lower.contains("how many pieces did") || lower.contains("pieces produced") || lower.contains("output today") || lower.contains("production of line") || lower.contains("production for line")) {
            return new ClassificationResult(ChatIntent.GET_TODAY_PRODUCTION, entities);
        }
        if (lower.contains("hourly") || lower.contains("hour by hour") || lower.contains("hour slot") || lower.contains("per hour breakdown") || lower.contains("each hour")) {
            return new ClassificationResult(ChatIntent.GET_HOURLY_PRODUCTION, entities);
        }
        if (lower.contains("reject") || lower.contains("defect") || lower.contains("rework")) {
            return new ClassificationResult(ChatIntent.GET_REJECT_QUANTITY, entities);
        }
        if (lower.contains("actual efficiency") || (lower.contains("efficiency") && lower.contains("line"))) {
            return new ClassificationResult(ChatIntent.GET_ACTUAL_EFFICIENCY, entities);
        }

        // 12. Order & Style Master Queries
        if (lower.contains("delivery status") || lower.contains("delivery date") || lower.contains("when is delivery") || lower.contains("is order on time") || lower.contains("shipment")) {
            return new ClassificationResult(ChatIntent.GET_ORDER_DELIVERY_STATUS, entities);
        }
        if (lower.contains("order progress") || lower.contains("order status")) {
            return new ClassificationResult(ChatIntent.GET_ORDER_PROGRESS, entities);
        }
        if (lower.contains("order quantity") || lower.contains("how many pieces in order")) {
            return new ClassificationResult(ChatIntent.GET_ORDER_QUANTITY, entities);
        }
        if (lower.contains("order") || lower.contains("po-")) {
            return new ClassificationResult(ChatIntent.GET_ORDER_DETAILS, entities);
        }
        if (lower.contains("operations of style") || lower.contains("operations in this style") || lower.contains("style operations")) {
            return new ClassificationResult(ChatIntent.GET_STYLE_OPERATIONS, entities);
        }
        if (lower.contains("styles") || lower.contains("all styles") || lower.contains("style catalog") || lower.contains("style") || lower.contains("garment")) {
            return new ClassificationResult(ChatIntent.GET_STYLE_DETAILS, entities);
        }

        // 13. Line Master Queries
        if (lower.contains("line") && (lower.contains("details") || lower.contains("target") || lower.contains("capacity") || lower.contains("config") || lower.contains("specs"))) {
            return new ClassificationResult(ChatIntent.GET_LINE_DETAILS, entities);
        }

        return new ClassificationResult(ChatIntent.GENERAL_HELP, entities);
    }

    private ExtractedEntities extractEntities(String message, ChatContextDto context) {
        ExtractedEntities.ExtractedEntitiesBuilder builder = ExtractedEntities.builder();

        // 1. Extract Line
        Matcher lineMatcher = LINE_PATTERN.matcher(message);
        List<String> matchedLines = new ArrayList<>();
        while (lineMatcher.find()) {
            String num = lineMatcher.group(1);
            if (num == null) num = lineMatcher.group(2);
            if (num == null) {
                String word = lineMatcher.group(3);
                if (word != null) {
                    num = switch (word.toLowerCase()) {
                        case "one" -> "1";
                        case "two" -> "2";
                        case "three" -> "3";
                        case "four" -> "4";
                        case "five" -> "5";
                        case "six" -> "6";
                        case "seven" -> "7";
                        case "eight" -> "8";
                        case "nine" -> "9";
                        case "ten" -> "10";
                        default -> null;
                    };
                }
            }
            if (num != null) {
                matchedLines.add(String.format("Line %02d", Integer.parseInt(num)));
            }
        }

        if (!matchedLines.isEmpty()) {
            builder.lineCode(matchedLines.get(0));
            builder.compareLines(matchedLines);
        } else if (context != null && context.getLineCode() != null) {
            builder.lineCode(context.getLineCode());
            builder.lineId(context.getLineId());
        }

        // 2. Extract Style Code (e.g. STY-TSHIRT-480, STY-POLO-800, ST-001, DENIM-001)
        Pattern stylePattern = Pattern.compile("(?i)(STY-[A-Z0-9-]+|ST-\\d+|DENIM-\\d+|POLO-\\d+|SHIRT-\\d+|JACKET-\\d+|TEE-\\d+|STYLE-\\d+)");
        Matcher styleMatcher = stylePattern.matcher(message);
        if (styleMatcher.find()) {
            builder.styleCode(styleMatcher.group(1).toUpperCase());
        } else if (context != null && context.getStyleCode() != null) {
            builder.styleCode(context.getStyleCode());
            builder.styleId(context.getStyleId());
        }

        // 3. Extract Order Code (e.g. PO-2026-003, PO-LEVIS-CHINO-620, ORD-01)
        Pattern orderPattern = Pattern.compile("(?i)(PO-[A-Z0-9-]+|ORD-[A-Z0-9-]+)");
        Matcher orderMatcher = orderPattern.matcher(message);
        if (orderMatcher.find()) {
            builder.orderCode(orderMatcher.group(1).toUpperCase());
        } else if (context != null && context.getOrderCode() != null) {
            builder.orderCode(context.getOrderCode());
            builder.orderId(context.getOrderId());
        }

        // 4. Extract Buyer Name (e.g. Netplay, Zara, Zara Men, Levi Strauss, Levi's, H&M, Nike)
        String lowerMsg = message.toLowerCase();
        String[] knownBuyers = {"netplay", "zara men", "zara", "levi strauss & co", "levi strauss", "levi's", "levis", "h&m", "gap", "nike", "puma", "adidas", "tommy hilfiger"};
        for (String b : knownBuyers) {
            if (lowerMsg.contains(b)) {
                builder.buyerName(capitalizeWords(b));
                break;
            }
        }
        if (builder.build().getBuyerName() == null) {
            Pattern buyerPattern = Pattern.compile("(?i)(?:ordered by|buyer|orders for)\\s+([a-zA-Z0-9 &'-]+?)(?:\\?|$|\\s+in|\\s+for|\\s+with)");
            Matcher buyerMatcher = buyerPattern.matcher(message);
            if (buyerMatcher.find()) {
                String extracted = buyerMatcher.group(1).trim();
                if (!extracted.equalsIgnoreCase("all") && !extracted.equalsIgnoreCase("line") && !extracted.equalsIgnoreCase("style") && !extracted.equalsIgnoreCase("today")) {
                    builder.buyerName(capitalizeWords(extracted));
                }
            }
        }

        // 5. Extract Operation Name candidates (both database catalog and industry standard)
        String[] commonOps = {
                "bottom hem", "shoulder join", "neck rib attach", "neck top stitch",
                "sleeve attach left", "sleeve attach right", "sleeve attach",
                "side seam close", "side seam", "sleeve hem", "label attach",
                "trim check", "thread trimming", "initial inspection", "spot cleaning",
                "final measurement", "final inspection", "folding", "poly bag packing", "carton packing",
                "back pocket attach", "pocket attach", "zipper attach", "fly attach",
                "inseam", "waistband attach", "collar attach", "loop attach", "cuff attach",
                "front rise", "back rise", "coin pocket", "button hole", "button attach", "bar tack"
        };
        for (String op : commonOps) {
            if (lowerMsg.contains(op)) {
                builder.operationName(capitalizeWords(op));
                break;
            }
        }

        // 6. Extract Station Number (e.g. Station #6, Station S12, Station 3)
        Pattern stationPattern = Pattern.compile("(?i)station\\s*(?:#|s)?\\s*(\\d+)");
        Matcher stationMatcher = stationPattern.matcher(message);
        if (stationMatcher.find()) {
            try {
                builder.stationNum(Integer.parseInt(stationMatcher.group(1)));
            } catch (NumberFormatException ignored) {}
        }

        // 7. Extract Operator Name — "operator Ramu", "Suresh's skill", "who is Kavitha"
        Pattern operatorNamePattern = Pattern.compile(
            "(?i)(?:operator|technician|sewer|tailor)\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)?)");
        Matcher opNameMatcher = operatorNamePattern.matcher(message);
        if (opNameMatcher.find()) {
            builder.operatorName(opNameMatcher.group(1).trim());
        } else {
            Pattern whoIsPattern = Pattern.compile(
                "(?i)(?:who is|for)\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)?)(?:'s|\\s|$)");
            Matcher whoIsMatcher = whoIsPattern.matcher(message);
            if (whoIsMatcher.find()) {
                String candidate = whoIsMatcher.group(1).trim();
                if (!candidate.equalsIgnoreCase("the") && !candidate.equalsIgnoreCase("line")
                    && !candidate.equalsIgnoreCase("this") && candidate.length() > 2) {
                    builder.operatorName(candidate);
                }
            }
        }

        // 8. Extract Machine Type keywords
        String[] machineKeywords = {"snls", "dnls", "overlock", "flatlock", "bartack", "bar tack",
                "single needle", "double needle", "zigzag", "button hole machine", "button attach machine",
                "chain stitch", "cover stitch", "feed off arm"};
        for (String mk : machineKeywords) {
            if (lowerMsg.contains(mk)) {
                builder.machineType(mk.toUpperCase());
                break;
            }
        }

        return builder.build();
    }

    private String capitalizeWords(String str) {
        String[] words = str.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isEmpty()) {
                sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1)).append(" ");
            }
        }
        return sb.toString().trim();
    }
}
