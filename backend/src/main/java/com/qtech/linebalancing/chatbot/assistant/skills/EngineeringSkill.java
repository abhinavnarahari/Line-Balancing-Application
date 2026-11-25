package com.qtech.linebalancing.chatbot.assistant.skills;

import com.qtech.linebalancing.capacity.entity.CapacityPlan;
import com.qtech.linebalancing.capacity.repository.CapacityPlanRepository;
import com.qtech.linebalancing.chatbot.assistant.Answer;
import com.qtech.linebalancing.chatbot.assistant.Fmt;
import com.qtech.linebalancing.chatbot.assistant.nlu.AnalyzedQuestion;
import com.qtech.linebalancing.chatbot.assistant.nlu.EntityType;
import com.qtech.linebalancing.chatbot.assistant.nlu.Intent;
import com.qtech.linebalancing.chatbot.assistant.nlu.Text;
import com.qtech.linebalancing.line.entity.SewingLine;
import com.qtech.linebalancing.line.repository.SewingLineRepository;
import com.qtech.linebalancing.lineplan.repository.LinePlanRepository;
import com.qtech.linebalancing.operationbulletin.entity.BulletinLine;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.operationbulletin.repository.OperationBulletinRepository;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.order.repository.OrderRepository;
import com.qtech.linebalancing.style.entity.Style;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/** Operation bulletins, line-balancing arithmetic, capacity plans and IE term definitions. */
@Component
@RequiredArgsConstructor
public class EngineeringSkill implements Skill {

    /** Used only when the question gives no efficiency; always stated in the answer. */
    static final double DEFAULT_EFFICIENCY = 80.0;

    private final OperationBulletinRepository bulletinRepository;
    private final OrderRepository orderRepository;
    private final SewingLineRepository lineRepository;
    private final LinePlanRepository linePlanRepository;
    private final CapacityPlanRepository capacityPlanRepository;

    @Override
    public Set<Intent> intents() {
        return EnumSet.of(Intent.BULLETIN_DETAILS, Intent.BULLETIN_LIST, Intent.LINE_BALANCE_CALC, Intent.CAPACITY_PLAN, Intent.FORMULA_EXPLAIN);
    }

    @Override
    public Answer answer(AnalyzedQuestion q) {
        return switch (q.intent()) {
            case BULLETIN_DETAILS -> bulletin(q);
            case BULLETIN_LIST -> bulletins();
            case LINE_BALANCE_CALC -> balance(q);
            case CAPACITY_PLAN -> capacity(q);
            default -> formula(q);
        };
    }

    // ── bulletin resolution: bulletin > style > order > line ─────────────────────────

    /** The operation bulletin the question is about, following style/order/line links; empty if none applies. */
    Optional<OperationBulletin> resolveBulletin(AnalyzedQuestion q) {
        if (q.has(EntityType.BULLETIN)) return bulletinRepository.findById(q.first(EntityType.BULLETIN).get().id());
        if (q.has(EntityType.STYLE)) return liveBulletinForStyleId(q.first(EntityType.STYLE).get().id());
        Style style = null;
        if (q.has(EntityType.ORDER)) {
            style = orderRepository.findById(q.first(EntityType.ORDER).get().id()).map(Order::getStyle).orElse(null);
        } else if (q.has(EntityType.LINE)) {
            Long lineId = q.first(EntityType.LINE).get().id();
            SewingLine line = lineRepository.findById(lineId).orElse(null);
            if (line != null && line.getCurrentBulletin() != null) {
                String code = Text.compact(line.getCurrentBulletin());
                Optional<OperationBulletin> byCode = bulletinRepository.findAll().stream()
                        .filter(b -> Text.compact(b.getBulletinCode()).equals(code)).max(Comparator.comparingInt(EngineeringSkill::rank));
                if (byCode.isPresent()) return byCode;
            }
            style = linePlanRepository.findAll().stream()
                    .filter(p -> p.getLine() != null && p.getLine().getId().equals(lineId) && p.getOrder() != null)
                    .map(p -> p.getOrder().getStyle()).filter(Objects::nonNull).findFirst().orElse(null);
        }
        return style == null ? Optional.empty() : liveBulletinForStyleId(style.getId());
    }

    private Optional<OperationBulletin> liveBulletinForStyleId(Long styleId) {
        return bulletinRepository.findAll().stream()
                .filter(b -> b.getStyles() != null && b.getStyles().stream().anyMatch(s -> s.getId().equals(styleId)))
                .max(Comparator.comparingInt(EngineeringSkill::rank));
    }

    private static int rank(OperationBulletin b) {
        boolean live = b.getStatus() == OperationBulletin.Status.RELEASED || b.getStatus() == OperationBulletin.Status.PUBLISHED;
        return (live ? 1_000_000 : 0) + (b.getRevisionNumber() == null ? 0 : b.getRevisionNumber()) * 1000;
    }

    private Answer noBulletin(AnalyzedQuestion q) {
        String what = q.has(EntityType.STYLE) ? "style " + q.first(EntityType.STYLE).get().display()
                : q.has(EntityType.ORDER) ? "order " + q.first(EntityType.ORDER).get().display()
                : q.has(EntityType.LINE) ? "line " + q.first(EntityType.LINE).get().display() : null;
        if (what != null) {
            return Answer.notAvailable("No operation bulletin is linked to " + what + ". Bulletins are linked to styles on the "
                    + "[Operation Bulletins](/operation-bulletins) page.", List.of("List operation bulletins"));
        }
        String codes = bulletinRepository.findAll().stream().map(OperationBulletin::getBulletinCode).distinct().sorted().collect(Collectors.joining(", "));
        return Answer.notAvailable("Which operation bulletin (or style/order) do you mean? Available bulletins: " + codes + ".",
                bulletinRepository.findAll().stream().map(b -> "Show bulletin " + b.getBulletinCode()).distinct().limit(3).toList());
    }

    private static BigDecimal totalSmv(OperationBulletin b) {
        BigDecimal sum = b.getLines().stream().map(BulletinLine::getSmv).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.signum() > 0 ? sum : b.getTotalSmv();
    }

    // ── intents ──────────────────────────────────────────────────────────────────

    private Answer bulletin(AnalyzedQuestion q) {
        Optional<OperationBulletin> found = resolveBulletin(q);
        if (found.isEmpty()) return noBulletin(q);
        OperationBulletin b = found.get();
        BigDecimal total = totalSmv(b);
        List<BulletinLine> lines = b.getLines();
        StringBuilder t = new StringBuilder("**" + b.getBulletinCode() + " — " + b.getName() + "** (rev " + b.getRevisionNumber()
                + ", " + Fmt.humanize(b.getStatus()) + ")\n\n");
        t.append("- **Total SMV:** ").append(Fmt.smv(total)).append(" across ").append(lines.size()).append(" operations\n");
        if (b.getStyles() != null && !b.getStyles().isEmpty()) {
            t.append("- **Styles:** ").append(b.getStyles().stream().map(s -> s.getStyleNo() + (s.getBuyer() != null ? " (" + s.getBuyer() + ")" : "")).sorted().collect(Collectors.joining(", "))).append("\n");
        }
        lines.stream().filter(l -> l.getSmv() != null).max(Comparator.comparing(BulletinLine::getSmv)).ifPresent(l ->
                t.append("- **Longest operation:** ").append(l.getOperation().getName()).append(" — ").append(Fmt.smv(l.getSmv())).append("\n"));
        if (b.getApprovedBy() != null) t.append("- **Approved by:** ").append(b.getApprovedBy()).append("\n");
        if (b.getReleasedBy() != null) t.append("- **Released by:** ").append(b.getReleasedBy()).append("\n");
        List<List<Object>> rows = lines.stream().map(l -> List.<Object>of(l.getSequence(), l.getOperation().getOperationCode(), l.getOperation().getName(),
                l.getSmv() != null ? Fmt.dec(l.getSmv().doubleValue(), 4) : "—", Objects.toString(l.getMachineType(), "—"),
                l.getSkillRatingRequired() != null ? "L" + l.getSkillRatingRequired() + " " + com.qtech.linebalancing.common.skill.SkillScale.label(l.getSkillRatingRequired()) : "—")).toList();
        return Answer.of(t.toString(), List.of("Operation bulletins"),
                        List.of("Balance " + b.getBulletinCode() + " with 10 operators", "How many operators are needed for 120 pieces per hour on " + b.getBulletinCode() + "?"))
                .withPayload(Fmt.table(b.getBulletinCode() + " operation sequence", List.of("Seq", "Code", "Operation", "SMV (min)", "Machine", "Skill"), rows));
    }

    private Answer bulletins() {
        List<OperationBulletin> all = bulletinRepository.findAll().stream()
                .sorted(Comparator.comparing(OperationBulletin::getBulletinCode).thenComparing(OperationBulletin::getRevisionNumber)).toList();
        if (all.isEmpty()) return Answer.notAvailable("No operation bulletins exist yet. Create one on the [Operation Bulletins](/operation-bulletins) page.", List.of());
        List<List<Object>> rows = all.stream().map(b -> List.<Object>of(b.getBulletinCode(), b.getName(), b.getRevisionNumber(), Fmt.humanize(b.getStatus()),
                Fmt.dec(Optional.ofNullable(totalSmv(b)).orElse(BigDecimal.ZERO).doubleValue(), 4), b.getLines().size(),
                b.getStyles() == null ? "—" : b.getStyles().stream().map(Style::getStyleNo).sorted().collect(Collectors.joining(", ")))).toList();
        return Answer.of("There are **" + all.size() + " operation bulletin" + (all.size() == 1 ? "" : "s") + "** (counting revisions): "
                        + all.stream().map(b -> b.getBulletinCode() + " rev " + b.getRevisionNumber() + " — " + Fmt.humanize(b.getStatus())).collect(Collectors.joining("; ")) + ".",
                        List.of("Operation bulletins"), List.of("Show bulletin " + all.get(0).getBulletinCode()))
                .withPayload(Fmt.table("Operation bulletins", List.of("Code", "Name", "Rev", "Status", "Total SMV (min)", "Operations", "Styles"), rows));
    }

    /**
     * Standard IE arithmetic, same definitions as the app's capacity service:
     * pitch (s) = total SMV × 60 / operators; output/h at 100% = 3600 / pitch; at efficiency e: × e.
     * Required operators for a target T pcs/h = SMV × T / (60 × e); takt = 3600 / T; design pitch = takt × e.
     */
    private Answer balance(AnalyzedQuestion q) {
        Optional<OperationBulletin> found = resolveBulletin(q);
        if (found.isEmpty()) return noBulletin(q);
        OperationBulletin b = found.get();
        BigDecimal total = totalSmv(b);
        if (total == null || total.signum() <= 0) {
            return Answer.notAvailable("Bulletin " + b.getBulletinCode() + " has no SMVs, so no balancing figures can be calculated.", List.of());
        }
        double smv = total.doubleValue();
        boolean assumedEff = q.params().efficiencyPct() == null;
        double eff = assumedEff ? DEFAULT_EFFICIENCY : q.params().efficiencyPct();
        Integer operators = q.params().operatorCount();
        Integer target = q.params().targetPerHour();
        String effNote = assumedEff ? " (assumed — add e.g. \"at 85%\" to change it)" : "";

        if (operators == null && target == null) {
            return Answer.notAvailable("To balance **" + b.getBulletinCode() + "** (total SMV " + Fmt.dec(smv, 4) + " min) I need either the number "
                            + "of operators or an hourly target. For example: \"Balance " + b.getBulletinCode() + " with 10 operators\" or "
                            + "\"How many operators are needed for 120 pieces per hour on " + b.getBulletinCode() + "?\"",
                    List.of("Balance " + b.getBulletinCode() + " with 10 operators", "How many operators are needed for 120 pieces per hour on " + b.getBulletinCode() + "?"));
        }

        StringBuilder t = new StringBuilder("**Line balancing — " + b.getBulletinCode() + "** (total SMV " + Fmt.dec(smv, 4) + " min, "
                + b.getLines().size() + " operations)\n\n");
        Map<String, Object> metrics = new LinkedHashMap<>();
        double pitchSecs;
        if (target != null) {
            double takt = 3600.0 / target;
            double designPitch = takt * eff / 100.0;
            double theoretical = smv * target / 60.0;
            double required = theoretical / (eff / 100.0);
            int requiredOps = (int) Math.ceil(required - 1e-9);
            t.append("For a target of **").append(target).append(" pcs/hour** at ").append(Fmt.pct(eff)).append(" efficiency").append(effNote).append(":\n\n");
            t.append("- **Takt time:** 3600 ÷ ").append(target).append(" = **").append(Fmt.dec(takt, 2)).append(" s**\n");
            t.append("- **Design pitch:** takt × efficiency = **").append(Fmt.dec(designPitch, 2)).append(" s**\n");
            t.append("- **Operators needed:** ").append(Fmt.dec(smv, 4)).append(" × ").append(target).append(" ÷ (60 × ").append(Fmt.dec(eff / 100, 2))
                    .append(") = ").append(Fmt.dec(required, 2)).append(" → **").append(requiredOps).append(" operators**")
                    .append(" (").append(Fmt.dec(theoretical, 2)).append(" at 100% efficiency)\n");
            metrics.put("Takt (s)", Fmt.dec(takt, 2));
            metrics.put("Design pitch (s)", Fmt.dec(designPitch, 2));
            metrics.put("Operators needed", requiredOps);
            pitchSecs = designPitch;
        } else {
            pitchSecs = smv * 60.0 / operators;
            double out100 = 3600.0 / pitchSecs;
            double outEff = out100 * eff / 100.0;
            t.append("With **").append(operators).append(" operators** at ").append(Fmt.pct(eff)).append(" efficiency").append(effNote).append(":\n\n");
            t.append("- **Pitch time:** ").append(Fmt.dec(smv, 4)).append(" × 60 ÷ ").append(operators).append(" = **").append(Fmt.dec(pitchSecs, 2)).append(" s**\n");
            t.append("- **Output at 100%:** 3600 ÷ pitch = ").append(Fmt.dec(out100, 1)).append(" pcs/hour\n");
            t.append("- **Expected output:** **").append(Fmt.dec(outEff, 1)).append(" pcs/hour** (").append(Fmt.dec(outEff * 8, 0)).append(" per 8 working hours)\n");
            metrics.put("Pitch (s)", Fmt.dec(pitchSecs, 2));
            metrics.put("Output @100% (pcs/h)", Fmt.dec(out100, 1));
            metrics.put("Expected (pcs/h)", Fmt.dec(outEff, 1));
        }

        List<BulletinLine> ops = b.getLines().stream().filter(l -> l.getSmv() != null && l.getSmv().signum() > 0).toList();
        double pitch = pitchSecs;
        if (operators != null && operators >= ops.size()) {
            return wholeOperatorAllocation(b, ops, operators, smv, eff, pitch, t, effNote);
        }
        if (operators != null) {
            t.append("\nWith fewer operators (").append(operators).append(") than operations (").append(ops.size())
                    .append(") some operations must share a station; aim for about ").append(Fmt.dec(pitch, 2))
                    .append(" s of work per operator.");
        } else {
            List<BulletinLine> heavy = ops.stream().filter(l -> l.getSmv().doubleValue() * 60 > pitch + 1e-9).toList();
            if (heavy.isEmpty()) {
                t.append("\nEvery operation fits within the ").append(Fmt.dec(pitch, 2)).append(" s design pitch on one station.");
            } else {
                t.append("\n**Operations longer than the ").append(Fmt.dec(pitch, 2)).append(" s pitch** (need parallel operators): ")
                        .append(heavy.stream().map(l -> l.getOperation().getName() + " " + Fmt.dec(l.getSmv().doubleValue() * 60, 1) + " s → "
                                + (int) Math.ceil(l.getSmv().doubleValue() * 60 / pitch - 1e-9) + " operators").collect(Collectors.joining("; "))).append(".");
            }
        }
        t.append("\n\n*Theoretical figures from the bulletin's SMVs; open [Line Balancing](/line-balance) to build the actual workstation plan.*");
        List<List<Object>> rows = ops.stream().map(l -> {
            double secs = l.getSmv().doubleValue() * 60;
            return List.<Object>of(l.getSequence(), l.getOperation().getName(), Fmt.dec(secs, 1), Fmt.pct(secs / pitch * 100));
        }).toList();
        return Answer.of(t.toString(), List.of("Operation bulletins"), List.of("Show bulletin " + b.getBulletinCode(), "Explain pitch time"))
                .withPayload(Fmt.table("Operation load vs " + Fmt.dec(pitch, 2) + " s pitch", List.of("Seq", "Operation", "Time (s)", "% of pitch"), rows));
    }

    /**
     * Realistic figures when operators are whole people: one operator per operation, then each extra operator goes
     * to the current bottleneck (largest time ÷ operators). Output is limited by the slowest station; line balance
     * efficiency = total SMV (s) ÷ (bottleneck × operators) × 100, as in the app's balancing engine.
     */
    private Answer wholeOperatorAllocation(OperationBulletin b, List<BulletinLine> ops, int operators, double smv, double eff,
                                           double pitch, StringBuilder t, String effNote) {
        int[] alloc = new int[ops.size()];
        Arrays.fill(alloc, 1);
        for (int extra = operators - ops.size(); extra > 0; extra--) {
            int worst = 0;
            for (int i = 1; i < ops.size(); i++) {
                if (secs(ops.get(i)) / alloc[i] > secs(ops.get(worst)) / alloc[worst]) worst = i;
            }
            alloc[worst]++;
        }
        int bottleneck = 0;
        for (int i = 1; i < ops.size(); i++) if (secs(ops.get(i)) / alloc[i] > secs(ops.get(bottleneck)) / alloc[bottleneck]) bottleneck = i;
        double bnSecs = secs(ops.get(bottleneck)) / alloc[bottleneck];
        double out100 = 3600.0 / bnSecs;
        double outEff = out100 * eff / 100.0;
        double lbe = Math.min(100.0, smv * 60 / (bnSecs * operators) * 100);

        t.append("\n**Realistic allocation with whole operators:** the slowest station is **")
                .append(ops.get(bottleneck).getOperation().getName()).append("** (")
                .append(Fmt.dec(secs(ops.get(bottleneck)), 1)).append(" s ÷ ").append(alloc[bottleneck]).append(" operator")
                .append(alloc[bottleneck] == 1 ? "" : "s").append(" = ").append(Fmt.dec(bnSecs, 2)).append(" s), so the line can make about **")
                .append(Fmt.dec(outEff, 1)).append(" pcs/hour** at ").append(Fmt.pct(eff)).append(effNote.isEmpty() ? "" : " (assumed)")
                .append(" (").append(Fmt.dec(out100, 1)).append(" at 100%). Line balance efficiency: **").append(Fmt.pct(lbe)).append("**.");
        if (bnSecs > pitch + 0.05) {
            t.append(" The theoretical ").append(Fmt.dec(pitch, 2)).append(" s pitch is not reachable without splitting operations.");
        }
        t.append("\n\n*Theoretical figures from the bulletin's SMVs; open [Line Balancing](/line-balance) to build the actual workstation plan.*");

        List<List<Object>> rows = new ArrayList<>();
        for (int i = 0; i < ops.size(); i++) {
            double station = secs(ops.get(i)) / alloc[i];
            rows.add(List.of(ops.get(i).getSequence(), ops.get(i).getOperation().getName(), Fmt.dec(secs(ops.get(i)), 1), alloc[i],
                    Fmt.dec(station, 2), i == bottleneck ? "Bottleneck" : Fmt.pct(station / bnSecs * 100) + " of bottleneck"));
        }
        return Answer.of(t.toString(), List.of("Operation bulletins"),
                        List.of("Balance " + b.getBulletinCode() + " with " + (operators + 2) + " operators", "Explain line balance efficiency"))
                .withPayload(Fmt.table("Operator allocation — " + operators + " operators", List.of("Seq", "Operation", "Time (s)", "Operators", "Station time (s)", "Load"), rows));
    }

    private static double secs(BulletinLine l) {
        return l.getSmv().doubleValue() * 60;
    }

    private Answer capacity(AnalyzedQuestion q) {
        List<CapacityPlan> plans = new ArrayList<>();
        if (q.has(EntityType.ORDER)) plans.addAll(capacityPlanRepository.findByOrderId(q.first(EntityType.ORDER).get().id()));
        else if (q.has(EntityType.STYLE)) {
            Long sid = q.first(EntityType.STYLE).get().id();
            plans.addAll(capacityPlanRepository.findAll().stream().filter(p -> p.getStyle() != null && p.getStyle().getId().equals(sid)).toList());
        } else plans.addAll(capacityPlanRepository.findAll());
        if (plans.isEmpty()) {
            return Answer.notAvailable("No capacity plan exists" + (q.has(EntityType.ORDER) ? " for order " + q.first(EntityType.ORDER).get().display() : "")
                    + ". Capacity plans are created on the [Capacity Planning](/capacity-planning) page.", List.of("List orders"));
        }
        StringBuilder t = new StringBuilder();
        List<List<Object>> rows = new ArrayList<>();
        for (CapacityPlan p : plans) {
            t.append("**").append(p.getPlanCode()).append("** — order ").append(p.getOrder() != null ? p.getOrder().getOrderNo() : "—")
                    .append(" (").append(Fmt.humanize(p.getStatus())).append(")\n")
                    .append("- Target: **").append(Fmt.num(p.getTargetHourlyOutput())).append(" pcs/hour** at ")
                    .append(p.getPlannedEfficiency() != null ? Fmt.pct(p.getPlannedEfficiency()) : "—").append(" planned efficiency\n")
                    .append("- Takt **").append(p.getCustomerTaktSecs() != null ? Fmt.dec(p.getCustomerTaktSecs(), 2) + " s" : "—")
                    .append("**, designed pitch **").append(p.getDesignedPitchSecs() != null ? Fmt.dec(p.getDesignedPitchSecs(), 2) + " s" : "—").append("**\n")
                    .append("- Manpower: theoretical ").append(p.getTheoreticalManpower() != null ? Fmt.dec(p.getTheoreticalManpower(), 1) : "—")
                    .append(", planned **").append(p.getPlannedManpower() != null ? Fmt.dec(p.getPlannedManpower(), 1) : "—").append("**")
                    .append(" (SMV ").append(p.getTotalSmvMinutes() != null ? Fmt.dec(p.getTotalSmvMinutes(), 4) : "—").append(" min, ")
                    .append(Fmt.num(p.getOrderQuantity())).append(" pcs over ").append(Fmt.num(p.getAvailableDays())).append(" days)\n\n");
            rows.add(List.of(p.getPlanCode(), p.getOrder() != null ? p.getOrder().getOrderNo() : "—", Fmt.num(p.getTargetHourlyOutput()),
                    p.getCustomerTaktSecs() != null ? Fmt.dec(p.getCustomerTaktSecs(), 2) : "—",
                    p.getDesignedPitchSecs() != null ? Fmt.dec(p.getDesignedPitchSecs(), 2) : "—",
                    p.getPlannedManpower() != null ? Fmt.dec(p.getPlannedManpower(), 1) : "—"));
        }
        return Answer.of(t.toString().trim(), List.of("Capacity plans"), List.of("Explain takt time"))
                .withPayload(Fmt.table("Capacity plans", List.of("Plan", "Order", "Target/h", "Takt (s)", "Pitch (s)", "Planned manpower"), rows));
    }

    private static final Map<String, String> TERMS = new LinkedHashMap<>();

    static {
        TERMS.put("line balanc", """
                **Line balance efficiency** = total SMV (s) ÷ (slowest station time (s) × number of operators) × 100. \
                It shows how evenly work is spread; 100% means every station has exactly the same load. \
                The bottleneck station (longest effective time) sets the line's output.""");
        TERMS.put("takt", """
                **Takt time** is the pace the customer demand requires: takt (s) = 3600 ÷ required pieces per hour. \
                In SewNexa's capacity planning the hourly target comes from order quantity ÷ available days ÷ net working hours.""");
        TERMS.put("pitch", """
                **Pitch time** is the planned time per station. Design pitch = takt × planned efficiency; \
                for a given team, pitch = total SMV × 60 ÷ number of operators. Any operation longer than the pitch is a bottleneck \
                and needs parallel operators.""");
        TERMS.put("smv", """
                **SMV (Standard Minute Value)** is the standard time, in minutes, to complete an operation (or the whole garment, \
                as the sum in an operation bulletin). SewNexa stores SMVs in minutes; 0.45 min = 27 s.""");
        TERMS.put("sam", """
                **SAM (Standard Allowed Minutes)** is used interchangeably with SMV: the standard minutes for one piece. \
                Earned minutes = good pieces × SAM.""");
        TERMS.put("efficiency", """
                SewNexa uses two efficiency measures:
                - **Operator / piece-log efficiency** = earned minutes (good pieces × SAM) ÷ minutes worked × 100 (Production Monitoring).
                - **Hourly-board efficiency** = actual output ÷ target output × 100.""");
        TERMS.put("bottleneck", """
                A **bottleneck** is the station whose effective time (operation time ÷ operators on it) is longest — or longer than \
                the pitch time. It limits the whole line's output; fix it by adding a parallel operator, splitting the operation or \
                moving a higher-rated operator onto it.""");
        TERMS.put("wip", """
                **WIP (work in progress)** is the number of pieces waiting between operations. Each bulletin operation has a WIP \
                threshold (default 20 pcs); exceeding it raises a bottleneck alert.""");
        TERMS.put("manpower", """
                **Theoretical manpower** = total SMV (s) ÷ takt (s); **planned manpower** = total SMV (s) ÷ design pitch (s), \
                i.e. it includes the planned efficiency.""");
    }

    private Answer formula(AnalyzedQuestion q) {
        for (Map.Entry<String, String> e : TERMS.entrySet()) {
            if (q.normalized().contains(e.getKey())) {
                return Answer.of(e.getValue(), List.of("SewNexa calculation rules"), List.of("Balance a bulletin with 10 operators", "Explain line balance efficiency"));
            }
        }
        return Answer.of("I can explain these terms: " + String.join(", ", List.of("SMV", "SAM", "takt time", "pitch time", "efficiency",
                        "line balance efficiency", "bottleneck", "WIP", "manpower")) + ". Which one?", List.of(),
                List.of("What is takt time?", "What is pitch time?", "What is line balance efficiency?"));
    }
}
