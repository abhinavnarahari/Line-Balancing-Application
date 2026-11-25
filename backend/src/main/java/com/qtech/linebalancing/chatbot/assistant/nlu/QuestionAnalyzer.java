package com.qtech.linebalancing.chatbot.assistant.nlu;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Deterministic question understanding: entity recognition against {@link EntityCatalog} plus transparent,
 * weighted cue rules per {@link Intent}. Every routing decision can be explained and is covered by tests.
 */
@Component
@RequiredArgsConstructor
public class QuestionAnalyzer {

    /** Below this score the question is treated as not understood (or out of scope). */
    public static final double MIN_SCORE = 3.0;

    private final EntityCatalog catalog;

    private record Cue(Pattern pattern, double weight) {
    }

    private static Cue cue(String regex, double weight) {
        return new Cue(Pattern.compile("\\b(?:" + regex + ")\\b"), weight);
    }

    private static final String PEOPLE = "operators?|workers?|employees?|people|staff|helpers?|floaters?|quality checkers?|checkers?|supervisors?|tailors?";
    private static final String PEOPLE_PLURAL = "operators|workers|employees|people|staff|helpers|floaters|quality checkers|checkers|supervisors|tailors";
    private static final String LISTING = "list|show|display|give|which|who are|all|names? of";

    private static final Map<Intent, List<Cue>> CUES = new EnumMap<>(Intent.class);

    static {
        CUES.put(Intent.OPERATOR_COUNT, List.of(cue("how many (?:active )?(?:" + PEOPLE + ")|number of (?:" + PEOPLE + ")|headcount|total (?:" + PEOPLE + ")|count of (?:" + PEOPLE + ")", 4)));
        CUES.put(Intent.OPERATOR_LIST, List.of(
                cue("(?:" + LISTING + ")(?: [a-z0-9]+){0,3} (?:" + PEOPLE_PLURAL + ")", 3),
                cue("who (?:works?|is working|are working|is assigned|are assigned) (?:in|on|at|to)", 3)));
        CUES.put(Intent.OPERATOR_PROFILE, List.of(cue("profile|details?|about|who is|tell me|info|information|role|department|joined|joining", 1)));
        CUES.put(Intent.TOP_OPERATORS_FOR_OPERATION, List.of(
                cue("best|top|most skilled|skilled|experts?|highest rated|qualified|certified|fastest|good at|who can (?:do|sew|run)|star", 4),
                cue("skill(?:s| matrix)?|rating|ratings", 1)));
        CUES.put(Intent.ATTENDANCE_SUMMARY, List.of(cue("attendance|absent|absentees?|present|on leave|late comers?|came late|checked in|who came", 4)));
        CUES.put(Intent.OPERATION_DETAILS, List.of(cue("smv|sam|standard minutes?|standard time|machine type|which machine|what machine|operation code", 2)));
        CUES.put(Intent.OPERATION_LIST, List.of(
                cue("(?:" + LISTING + "|how many)(?: [a-z0-9]+){0,3} operations|operations list|operation list", 4),
                cue("operations", 1)));
        CUES.put(Intent.STYLE_DETAILS, List.of(cue("buyer|customer|season|product type|style details", 2)));
        CUES.put(Intent.STYLE_LIST, List.of(cue("(?:" + LISTING + "|how many)(?: [a-z0-9]+){0,3} styles|styles", 4)));
        CUES.put(Intent.LINE_DETAILS, List.of(cue("capacity|workstations?|supervisor|status|running|target efficiency|details?|staff(?:ing)?|plan", 1)));
        CUES.put(Intent.LINE_LIST, List.of(cue("(?:" + LISTING + "|how many)(?: [a-z0-9]+){0,2} (?:sewing )?lines|lines list", 4)));
        CUES.put(Intent.MACHINE_INVENTORY, List.of(cue("machines?|machine inventory|equipment", 3), cue("how many machines|machine count", 2)));
        CUES.put(Intent.SHIFT_INFO, List.of(cue("shifts?|shift timings?|timings?|break(?: time)?|working hours|start time|end time", 3)));
        CUES.put(Intent.BULLETIN_DETAILS, List.of(
                cue("bulletins?|operation sequence|sequence of operations|routing|operation breakdown", 2),
                cue("total smv|smv", 1)));
        CUES.put(Intent.BULLETIN_LIST, List.of(cue("(?:" + LISTING + "|how many)(?: [a-z0-9]+){0,2} bulletins|bulletins list", 4)));
        CUES.put(Intent.LINE_BALANCE_CALC, List.of(
                cue("balanc(?:e|ing)|pitch time|bottlenecks?", 3),
                cue("how many (?:operators|workers|people) (?:are |do i |do we )?(?:needed|required|need)|operators? (?:needed|required)|required (?:operators|manpower)|manpower (?:needed|required)", 4),
                cue("output (?:with|for|of)|pieces per hour|pcs per hour|per hour", 1)));
        CUES.put(Intent.CAPACITY_PLAN, List.of(cue("capacity plan(?:ning)?|takt(?: time)?|planned manpower|designed pitch|hourly target|target per hour|theoretical manpower", 3)));
        CUES.put(Intent.FORMULA_EXPLAIN, List.of(cue("what (?:is|are|does) (?:the )?(?:meaning of )?(?:an? )?(?:smv|sam|takt(?: time)?|pitch(?: time)?|efficiency|line balanc(?:e|ing)(?: efficiency)?|bottleneck|wip)|define|definition|meaning of|formula|explain|how (?:is|do you) (?:calculate|compute)", 4)));
        CUES.put(Intent.ORDER_STATUS, List.of(cue("progress|status|due|delivery|deliver(?:ed)?|completed?|completion|produced|remaining|pending|ship(?:ment|ped)?|how much|percent", 2)));
        CUES.put(Intent.ORDER_LIST, List.of(cue("(?:" + LISTING + "|how many)(?: [a-z0-9]+){0,3} orders|orders (?:in production|planned|completed|on hold)|open orders|pending orders|purchase orders", 4)));
        CUES.put(Intent.PRODUCTION_SUMMARY, List.of(
                cue("production|output|produced|pieces|pcs|rejects?|rejections?|defects?|good pieces|yield", 3),
                cue("efficiency|today|yesterday", 1)));
        CUES.put(Intent.ALERTS, List.of(cue("alerts?|notifications?|warnings?|unread", 4)));
        CUES.put(Intent.OVERVIEW, List.of(cue("overview|summary of (?:the )?(?:data|factory|application|system)|master data|how many records|what data", 4)));
        CUES.put(Intent.HOW_TO, List.of(cue("how (?:do|can|should) (?:i|we|you)|how to|where (?:do|can) (?:i|we)|where is|steps? to|guide me|walk me through|navigate|tutorial|how does (?:the )?[a-z0-9 ]{1,40} work|how (?:is|are) [a-z0-9 ]{1,30} (?:used|managed|recorded)", 4)));
        CUES.put(Intent.GREETING, List.of(cue("what can you do|what do you know|who are you|your capabilities|help me|what can i ask|how does (?:this|the) (?:app|application|system|sewnexa) work|what is sewnexa|features of sewnexa|what are the features", 6)));
    }

    /** Words that show a question is about this application even when no record is named. */
    private static final Pattern DOMAIN = Pattern.compile("\\b(?:sewnexa|app|application|factory|plant|floor|garment|sewing|operators?|workers?|operations?|smv|sam|styles?|orders?|po|buyers?|lines?|bulletins?|shifts?|machines?|attendance|absent|present|production|output|efficiency|skills?|takt|pitch|balanc\\w*|capacity|pieces|pcs|rejects?|defects?|wip|bottlenecks?|target|alerts?|notifications?|dashboard|placement|allocation|optimizer|monitoring|users?|password|login|role)\\b");

    private static final Pattern GREETING_ONLY = Pattern.compile("^(?:hi|hii|hello|hey|hai|good (?:morning|afternoon|evening)|namaste|thanks|thank you|ok|okay)(?: there| team| sewnexa)?$");
    private static final Pattern FOLLOW_UP = Pattern.compile("^(?:and|what about|how about|same for|also|then|for|now)\\b");
    private static final Pattern PRONOUN = Pattern.compile("\\b(?:it|its|it s|this|that|they|them|their|same)\\b");

    private static final Pattern OPERATOR_COUNT_PARAM = Pattern.compile("\\b(\\d{1,3})\\s*(?:operators?|workers?|people|persons?|ops|machinists?|manpower|stations?)\\b|\\bwith\\s+(\\d{1,3})\\b(?!\\s*(?:%|percent|pcs|pieces))");
    private static final Pattern EFFICIENCY_PARAM = Pattern.compile("(\\d{1,3}(?:\\.\\d+)?)\\s*(?:%|percent)");
    private static final Pattern TARGET_PARAM = Pattern.compile("(\\d{1,5})\\s*(?:pcs|pieces|pc|units|garments)?\\s*(?:per|an|a|/|every)\\s*(?:hour|hr|h)\\b");
    private static final Pattern ISO_DATE = Pattern.compile("\\b(\\d{4}-\\d{1,2}-\\d{1,2})\\b");
    private static final Pattern DMY_DATE = Pattern.compile("\\b(\\d{1,2})[/.-](\\d{1,2})[/.-](\\d{4})\\b");
    private static final Pattern NAMED_THING = Pattern.compile("\\b(operator|operation|style|order|po|line|bulletin|shift)\\s+([a-z0-9][a-z0-9 ]{1,30})");

    public AnalyzedQuestion analyze(String question) {
        String original = question == null ? "" : question.trim();
        String normalized = Text.normalize(original);
        String lowerOriginal = original.toLowerCase(Locale.ROOT);

        // 1. Entities
        Map<EntityType, List<EntityRef>> entities = new EnumMap<>(EntityType.class);
        List<EntityCatalog.Mention> ambiguous = new ArrayList<>();
        for (EntityCatalog.Mention m : catalog.match(normalized)) {
            Map<EntityType, List<EntityRef>> byType = new EnumMap<>(EntityType.class);
            m.candidates().forEach(c -> byType.computeIfAbsent(c.type(), k -> new ArrayList<>()).add(c));
            byType.forEach((type, refs) -> {
                if (refs.size() == 1) {
                    entities.computeIfAbsent(type, k -> new ArrayList<>()).add(refs.get(0));
                } else {
                    ambiguous.add(new EntityCatalog.Mention(m.text(), refs, m.fuzzy()));
                }
            });
        }

        // 2. Parameters
        AnalyzedQuestion.Params params = new AnalyzedQuestion.Params(
                extractInt(OPERATOR_COUNT_PARAM, lowerOriginal),
                extractDouble(EFFICIENCY_PARAM, lowerOriginal),
                extractTarget(lowerOriginal),
                extractDate(normalized, original),
                extractRole(normalized),
                extractOrderStatus(normalized));

        // 3. Intent
        Intent intent;
        double best;
        if (GREETING_ONLY.matcher(normalized).matches() || normalized.isBlank()) {
            intent = Intent.GREETING;
            best = 10;
        } else {
            Map<Intent, Double> scores = score(normalized, entities, params, !ambiguous.isEmpty());
            Map.Entry<Intent, Double> top = scores.entrySet().stream()
                    .max(Map.Entry.<Intent, Double>comparingByValue().thenComparing(e -> -e.getKey().ordinal()))
                    .orElse(Map.entry(Intent.UNKNOWN, 0.0));
            best = top.getValue();
            intent = best >= MIN_SCORE ? top.getKey() : Intent.UNKNOWN;
            if (intent == Intent.UNKNOWN && entities.isEmpty() && ambiguous.isEmpty() && !DOMAIN.matcher(normalized).find()) {
                intent = Intent.OUT_OF_SCOPE;
            }
        }

        AnalyzedQuestion.Unresolved unresolved = findUnresolved(normalized, entities, ambiguous);
        return new AnalyzedQuestion(original, normalized, intent, Math.min(1.0, best / 8.0), entities, ambiguous,
                unresolved, params, false);
    }

    /** Starts like a continuation: "and LINE-02?", "what about yesterday?", "same for PO-2026-002". */
    public boolean startsLikeFollowUp(AnalyzedQuestion q) {
        return FOLLOW_UP.matcher(q.normalized()).find() && Text.tokens(q.normalized()).size() <= 8;
    }

    /** True for short "and LINE-02?" / "what about yesterday?" / "what is its SMV?" style questions. */
    public boolean looksLikeFollowUp(AnalyzedQuestion q) {
        int tokens = Text.tokens(q.normalized()).size();
        return (FOLLOW_UP.matcher(q.normalized()).find() && tokens <= 8) || (PRONOUN.matcher(q.normalized()).find() && tokens <= 10);
    }

    private Map<Intent, Double> score(String text, Map<EntityType, List<EntityRef>> entities,
                                      AnalyzedQuestion.Params params, boolean hasAmbiguous) {
        Map<Intent, Double> s = new EnumMap<>(Intent.class);
        CUES.forEach((intent, cues) -> {
            double total = 0;
            for (Cue c : cues) if (c.pattern().matcher(text).find()) total += c.weight();
            if (total > 0) s.put(intent, total);
        });
        // Intents whose wording matched; secondary signals below only strengthen these (never entity-only scores).
        Set<Intent> cued = s.isEmpty() ? EnumSet.noneOf(Intent.class) : EnumSet.copyOf(s.keySet());
        for (Intent intent : Intent.values()) {
            EntityType primary = intent.primaryEntity();
            if (primary != null && (entities.containsKey(primary) || (hasAmbiguous && primary == EntityType.OPERATOR))) {
                s.merge(intent, 3.0, Double::sum);
            }
        }
        boolean anyData = entities.keySet().stream().anyMatch(t -> t != EntityType.MACHINE_TYPE);

        // Secondary entity signals
        if (entities.containsKey(EntityType.ORDER)) {
            s.merge(Intent.CAPACITY_PLAN, cued.contains(Intent.CAPACITY_PLAN) ? 2.0 : 0.0, Double::sum);
            s.merge(Intent.PRODUCTION_SUMMARY, cued.contains(Intent.PRODUCTION_SUMMARY) ? 1.0 : 0.0, Double::sum);
        }
        if (entities.containsKey(EntityType.STYLE) || entities.containsKey(EntityType.BULLETIN)) {
            if (cued.contains(Intent.BULLETIN_DETAILS)) s.merge(Intent.BULLETIN_DETAILS, 3.0, Double::sum);
            if (cued.contains(Intent.LINE_BALANCE_CALC)) s.merge(Intent.LINE_BALANCE_CALC, 3.0, Double::sum);
        }
        if (entities.containsKey(EntityType.LINE)) {
            if (cued.contains(Intent.PRODUCTION_SUMMARY)) s.merge(Intent.PRODUCTION_SUMMARY, 3.0, Double::sum);
            if (cued.contains(Intent.MACHINE_INVENTORY)) s.merge(Intent.MACHINE_INVENTORY, 2.0, Double::sum);
            if (cued.contains(Intent.OPERATOR_COUNT)) s.merge(Intent.OPERATOR_COUNT, 2.0, Double::sum);
            if (cued.contains(Intent.OPERATOR_LIST)) s.merge(Intent.OPERATOR_LIST, 2.0, Double::sum);
        }
        if (entities.containsKey(EntityType.BUYER)) {
            s.merge(Text.hasPhrase(text, "styles") || Text.hasPhrase(text, "style") ? Intent.STYLE_LIST : Intent.ORDER_LIST, 3.0, Double::sum);
        }
        if (entities.containsKey(EntityType.MACHINE_TYPE)) {
            s.merge(Text.hasPhrase(text, "operations") ? Intent.OPERATION_LIST : Intent.MACHINE_INVENTORY, 2.0, Double::sum);
        }
        if (entities.containsKey(EntityType.SHIFT)) s.merge(Intent.SHIFT_INFO, 3.0, Double::sum);
        if (entities.containsKey(EntityType.OPERATOR) && cued.contains(Intent.ATTENDANCE_SUMMARY)) {
            s.merge(Intent.ATTENDANCE_SUMMARY, 1.0, Double::sum);
        }
        if (params.operatorCount() != null || params.targetPerHour() != null) {
            // A team size or hourly target together with a garment (bulletin/style) is a balancing calculation.
            boolean garment = entities.containsKey(EntityType.BULLETIN) || entities.containsKey(EntityType.STYLE);
            s.merge(Intent.LINE_BALANCE_CALC, garment ? 4.0 : (cued.contains(Intent.LINE_BALANCE_CALC) ? 2.0 : 0.0), Double::sum);
        }
        if (params.date() != null && cued.contains(Intent.PRODUCTION_SUMMARY)) s.merge(Intent.PRODUCTION_SUMMARY, 1.0, Double::sum);
        if (params.role() != null) {
            if (cued.contains(Intent.OPERATOR_COUNT)) s.merge(Intent.OPERATOR_COUNT, 1.0, Double::sum);
            if (cued.contains(Intent.OPERATOR_LIST)) s.merge(Intent.OPERATOR_LIST, 1.0, Double::sum);
        }
        // A named operator means "this operator", not a list or headcount.
        if (entities.containsKey(EntityType.OPERATOR)) {
            if (cued.contains(Intent.OPERATOR_LIST)) s.merge(Intent.OPERATOR_LIST, -3.0, Double::sum);
            if (cued.contains(Intent.OPERATOR_COUNT)) s.merge(Intent.OPERATOR_COUNT, -3.0, Double::sum);
        }
        // A term definition is only wanted when the question is not about a specific record.
        if (anyData && cued.contains(Intent.FORMULA_EXPLAIN)) s.merge(Intent.FORMULA_EXPLAIN, -5.0, Double::sum);
        // "What is the SMV of X": details, not the operation list.
        if (entities.containsKey(EntityType.OPERATION) && cued.contains(Intent.OPERATION_LIST)) s.merge(Intent.OPERATION_LIST, -3.0, Double::sum);
        return s;
    }

    private AnalyzedQuestion.Unresolved findUnresolved(String text, Map<EntityType, List<EntityRef>> entities,
                                                       List<EntityCatalog.Mention> ambiguous) {
        Matcher m = NAMED_THING.matcher(text);
        while (m.find()) {
            EntityType type = switch (m.group(1)) {
                case "operator" -> EntityType.OPERATOR;
                case "operation" -> EntityType.OPERATION;
                case "style" -> EntityType.STYLE;
                case "order", "po" -> EntityType.ORDER;
                case "line" -> EntityType.LINE;
                case "bulletin" -> EntityType.BULLETIN;
                default -> EntityType.SHIFT;
            };
            if (entities.containsKey(type) || !ambiguous.isEmpty()) continue;
            List<String> words = Text.tokens(m.group(2).trim());
            List<String> name = new ArrayList<>();
            for (String w : words) {
                if (Set.of("is", "for", "of", "with", "in", "on", "and", "the", "today", "yesterday", "details", "status", "smv").contains(w)) break;
                name.add(w);
                if (name.size() == 3) break;
            }
            if (!name.isEmpty()) return new AnalyzedQuestion.Unresolved(type, String.join(" ", name));
        }
        return null;
    }

    private static Integer extractInt(Pattern p, String text) {
        Matcher m = p.matcher(text);
        if (!m.find()) return null;
        String g = m.group(1) != null ? m.group(1) : m.group(2);
        int v = Integer.parseInt(g);
        return v > 0 && v <= 500 ? v : null;
    }

    private static Double extractDouble(Pattern p, String text) {
        Matcher m = p.matcher(text);
        if (!m.find()) return null;
        double v = Double.parseDouble(m.group(1));
        return v > 0 && v <= 150 ? v : null;
    }

    private static Integer extractTarget(String text) {
        Matcher m = TARGET_PARAM.matcher(text);
        return m.find() ? Integer.valueOf(m.group(1)) : null;
    }

    private static LocalDate extractDate(String normalized, String original) {
        LocalDate today = LocalDate.now();
        if (Text.hasPhrase(normalized, "yesterday")) return today.minusDays(1);
        if (Text.hasPhrase(normalized, "today") || Text.hasPhrase(normalized, "now") || Text.hasPhrase(normalized, "currently")) return today;
        if (Text.hasPhrase(normalized, "tomorrow")) return today.plusDays(1);
        Matcher iso = ISO_DATE.matcher(original);
        if (iso.find()) {
            try {
                return LocalDate.parse(iso.group(1), DateTimeFormatter.ofPattern("yyyy-M-d"));
            } catch (DateTimeParseException ignored) {
                return null;
            }
        }
        Matcher dmy = DMY_DATE.matcher(original);
        if (dmy.find()) {
            try {
                return LocalDate.of(Integer.parseInt(dmy.group(3)), Integer.parseInt(dmy.group(2)), Integer.parseInt(dmy.group(1)));
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }

    private static String extractRole(String text) {
        if (text.matches(".*\\bhelpers?\\b.*")) return "HELPER";
        if (text.matches(".*\\bfloaters?\\b.*")) return "FLOATER";
        if (text.matches(".*\\b(?:quality checkers?|checkers?|qc)\\b.*")) return "QUALITY_CHECKER";
        if (text.matches(".*\\b(?:line )?supervisors?\\b.*")) return "LINE_SUPERVISOR";
        return null;
    }

    private static String extractOrderStatus(String text) {
        if (Text.hasPhrase(text, "in production") || Text.hasPhrase(text, "running")) return "IN_PRODUCTION";
        if (Text.hasPhrase(text, "planned")) return "PLANNED";
        if (Text.hasPhrase(text, "completed") || Text.hasPhrase(text, "finished")) return "COMPLETED";
        if (Text.hasPhrase(text, "on hold")) return "ON_HOLD";
        return null;
    }
}
