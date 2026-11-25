package com.qtech.linebalancing.chatbot.assistant.skills;

import com.qtech.linebalancing.chatbot.assistant.Answer;
import com.qtech.linebalancing.chatbot.assistant.nlu.AnalyzedQuestion;
import com.qtech.linebalancing.chatbot.assistant.nlu.EntityCatalog;
import com.qtech.linebalancing.chatbot.assistant.nlu.EntityType;
import com.qtech.linebalancing.chatbot.assistant.nlu.Intent;
import com.qtech.linebalancing.chatbot.assistant.nlu.Text;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * How-to guidance about the SewNexa application (curated, matches the real screens and routes), greetings,
 * out-of-scope refusals and clarification prompts.
 */
@Component
@RequiredArgsConstructor
public class HelpSkill implements Skill {

    private final EntityCatalog catalog;

    private record Topic(Set<String> keywords, String answer) {
    }

    /**
     * Every route and label below exists in the application (see frontend/src/app/router.tsx and the sidebar).
     * Specific workflows come first: on a keyword tie the earlier topic wins ("balance a line" → balancing, not lines).
     */
    private static final List<Topic> TOPICS = List.of(
            new Topic(Set.of("login", "log in", "sign in", "password", "user", "users", "account", "accounts", "role", "roles", "access", "permission"), """
                    **Accounts and sign-in**
                    - A System Administrator creates accounts under **Settings → User Accounts** ([open](/settings/users)) with **Add User**, choosing the role (Industrial Engineer, Production Manager, Line Supervisor or System Administrator).
                    - Anyone can change their own password from the profile menu (top right) → **Change Password**.
                    - Forgotten passwords are reset by an administrator on the User Accounts page (key icon).
                    - Line Supervisors can record floor data (attendance, production, shift assignments, performance tests) but cannot change plans or master data."""),
            new Topic(Set.of("order", "orders", "purchase order", "po"), """
                    **Production orders** are on **Production Orders** ([open](/orders)): buyer, style, colour, size breakdown, delivery and planned completion dates, and status (Planned, In production, On hold, Completed). Orders can only be deleted while Planned and before any production is recorded."""),
            new Topic(Set.of("bulletin", "bulletins", "ob", "revision", "approve", "release", "publish"), """
                    **Operation bulletins** ([open](/operation-bulletins)) define the operation sequence and SMVs for a style.
                    - Workflow: Draft → Under review → Approved → Released/Published (Archived/Obsolete when retired). A bulletin must be approved before it is released.
                    - Only Draft and Under-review bulletins can be edited. For an approved or released bulletin click **Create Revision** — it creates an editable Draft copy."""),
            new Topic(Set.of("balance", "balancing", "pitch", "bottleneck", "workstation", "workstations"), """
                    **Line balancing** is done in **Planned Balancing** ([open](/line-balance)) — or **Fixed Shift Target** ([open](/fixed-shift-target)) when you plan for a fixed output per shift.
                    1. Pick the order, line and shift; the operation bulletin is loaded with its SMVs.
                    2. Review takt/pitch time and the station loads; stations above the pitch are bottlenecks.
                    3. Assign operators to stations (the optimizer can propose them from the skill matrix) and save the plan.
                    You can also ask me, e.g. "Balance OB-CREW-101 with 10 operators"."""),
            new Topic(Set.of("capacity", "takt", "line design", "architecture", "layout"), """
                    **Capacity Planning** ([open](/capacity-planning)) turns an order into an hourly target, takt time, design pitch and manpower. **Line Architecture** ([open](/line-design)) builds the workstation layout and machine requirement from it."""),
            new Topic(Set.of("optimizer", "allocation", "allocate", "multi line", "placement", "place"), """
                    **Multi-Line Optimizer** ([open](/operator-allocation)) allocates the available operators across several lines using skills, machine qualification and attendance; you can tune the weights before solving. **Operator Placement** ([open](/operator-placement)) shows who sits on which station."""),
            new Topic(Set.of("skill", "skills", "rating", "matrix", "performance test", "assessment"), """
                    The **Sewing Skill Matrix** ([open](/skill-matrix)) holds a skill level per operator and operation on the 4-level scale: 1 in training, 2 needs supervisor help, 3 independent, 4 expert (trains others). Record a performance test (timed cycles) to update ratings; the change history is under **Skill Matrix → Logs** ([open](/skill-matrix/logs))."""),
            new Topic(Set.of("attendance", "absent", "present", "late", "assign shift", "shift assignment", "immediate", "floater", "floaters"), """
                    **Daily Attendance** ([open](/attendance)) marks operators present/absent/late per shift (or syncs biometric data). **Shift Assignment** ([open](/shift-assignment)) assigns operators to shifts with **Assign Shift** — periods for one operator cannot overlap. **Immediate Actions** ([open](/immediate-actions)) lists today's attendance gaps and floater needs."""),
            new Topic(Set.of("production", "piece", "pieces", "log", "monitoring", "output", "hourly", "reject"), """
                    Record output on **Live Monitoring** ([open](/monitoring)) with **Log Piece Run**: operator, operation, order, completed/good/reject quantities and start/end time. Good + reject must equal completed. Efficiency there = earned minutes (good × SAM) ÷ minutes worked."""),
            new Topic(Set.of("dashboard", "dashboards", "kpi", "report", "overview"), """
                    Dashboards: **Factory Overview** ([open](/)), **Plant Executive** ([open](/plant-dashboard)) and **Line Operations** ([open](/line-dashboard)). Lists can be exported to Excel from each master page."""),
            new Topic(Set.of("operator", "operators", "worker", "workers", "employee"), """
                    **Operators** are managed under **Settings → Sewing Operators** ([open](/settings/operators)).
                    - Use **Register Operator** to add one (employee ID, name, age, gender, department, joining date, role).
                    - Many operators can be imported from Excel with the page's Import button; the whole file is validated first and nothing is imported if a row is wrong.
                    - Open an operator to see their profile, documents and skill ratings."""),
            new Topic(Set.of("operation", "operations", "smv", "sam"), """
                    **Operations and SMVs** are maintained under **Settings → Operations & SMV** ([open](/settings/operations)): code, name, standard SMV (minutes), machine type and alternative operations (affinities)."""),
            new Topic(Set.of("style", "styles", "size", "sizes", "buyer"), """
                    **Styles** are in **Settings → Style Catalog** ([open](/settings/styles)) and **sizes** in **Settings → Garment Sizes** ([open](/settings/sizes)). Link a style to its operation bulletin on the Operation Bulletins page."""),
            new Topic(Set.of("line", "lines", "sewing line", "machine", "machines", "shift", "shifts", "break"), """
                    **Factory set-up** lives under **Settings**: Sewing Lines ([open](/settings/lines)), Sewing Machines ([open](/settings/machines)) and Shifts & Breaks ([open](/settings/shifts))."""),
            new Topic(Set.of("import", "export", "excel", "upload", "download"), """
                    Master pages (operators, operations, lines, machines, styles, sizes, shifts) have **Import/Export** buttons for Excel. Imports are validated row by row and report the row number of any problem; operator imports are all-or-nothing.""")
    );

    @Override
    public Set<Intent> intents() {
        return EnumSet.of(Intent.HOW_TO, Intent.GREETING, Intent.OUT_OF_SCOPE, Intent.UNKNOWN);
    }

    @Override
    public Answer answer(AnalyzedQuestion q) {
        return switch (q.intent()) {
            case HOW_TO -> howTo(q);
            case GREETING -> greeting();
            case OUT_OF_SCOPE -> Answer.notAvailable(
                    "I can only help with **SewNexa** — your factory's data (operators, skills, attendance, orders, operation bulletins, "
                            + "lines, machines, production) and how to use the application. I can't answer general questions.",
                    examples());
            default -> notUnderstood(q);
        };
    }

    private Answer howTo(AnalyzedQuestion q) {
        Topic best = null;
        int bestScore = 0;
        for (Topic t : TOPICS) {
            int score = 0;
            for (String k : t.keywords()) if (Text.hasPhrase(q.normalized(), k)) score += k.contains(" ") ? 2 : 1;
            if (score > bestScore) {
                bestScore = score;
                best = t;
            }
        }
        if (best == null) {
            return Answer.notAvailable("I can guide you through: accounts and sign-in, operators, operations & SMV, styles, lines/machines/shifts, "
                    + "orders, operation bulletins, line balancing, capacity planning, the multi-line optimizer, the skill matrix, attendance, "
                    + "production logging, dashboards and Excel import/export. What would you like to do?",
                    List.of("How do I balance a line?", "How do I add an operator?", "How do I create a bulletin revision?"));
        }
        return Answer.of(best.answer(), List.of("SewNexa user guide"), List.of("How do I balance a line?", "How do I record production?"));
    }

    private Answer greeting() {
        return Answer.of("""
                Hi! I'm **SewNexa AI**. I answer from your factory's live SewNexa data only, for example:
                - **Workforce:** headcounts, operator profiles, best operators for an operation, attendance
                - **Engineering:** operation SMVs, operation bulletins, line-balancing and manpower calculations, capacity plans
                - **Orders & production:** order progress and delivery, daily output, rejects and efficiency, alerts
                - **How-to:** where and how to do something in the application""", List.of(), examples());
    }

    /** Clarify ambiguous names, report names that do not exist, or ask for a rephrase — never guess. */
    private Answer notUnderstood(AnalyzedQuestion q) {
        if (!q.ambiguous().isEmpty()) {
            EntityCatalog.Mention m = q.ambiguous().get(0);
            return Answer.notAvailable("\"" + m.text() + "\" matches more than one " + m.candidates().get(0).type().label() + ": "
                            + String.join(", ", m.candidates().stream().map(c -> c.display()).toList()) + ". Which one do you mean?",
                    m.candidates().stream().limit(3).map(c -> "Show " + c.type().label() + " " + c.display()).toList());
        }
        if (q.unresolved() != null) {
            EntityType type = q.unresolved().type();
            List<String> close = catalog.suggest(type, q.unresolved().text(), 3).stream().map(r -> r.display()).toList();
            String label = type.label();
            String article = "aeiou".indexOf(label.charAt(0)) >= 0 ? "an " : "a ";
            return Answer.notAvailable("I couldn't find " + article + label + " called \"" + titleCase(q.unresolved().text()) + "\" in SewNexa."
                            + (close.isEmpty() ? "" : " Closest matches: " + String.join(", ", close) + "."),
                    close.stream().map(c -> "Show " + type.label() + " " + c).toList());
        }
        return Answer.notAvailable("I'm not sure what you're asking. I can answer questions about SewNexa data — try one of these, "
                + "or ask \"what can you do?\".", examples());
    }

    /** "Shoulder Join (OP-001)" -> "Shoulder Join". */
    private static String nameOnly(String display) {
        int i = display.indexOf(" (");
        return i > 0 ? display.substring(0, i) : display;
    }

    /** A group of starter questions for the chat panel. */
    public record PromptCategory(String id, String label, List<String> prompts) {
    }

    /** Starter questions for the chat UI, built from records that exist so every one gets a real answer. */
    public List<PromptCategory> starterQuestions() {
        Optional<String> order = catalog.all(EntityType.ORDER).stream().findFirst().map(r -> r.display());
        Optional<String> bulletin = catalog.all(EntityType.BULLETIN).stream().findFirst().map(r -> r.display());
        Optional<String> operation = catalog.all(EntityType.OPERATION).stream().findFirst().map(r -> nameOnly(r.display()));
        Optional<String> operator = catalog.all(EntityType.OPERATOR).stream().findFirst().map(r -> nameOnly(r.display()));

        List<String> workforce = new ArrayList<>(List.of("How many operators are there?", "Show today's attendance"));
        operation.ifPresent(o -> workforce.add("Who are the best operators for " + o + "?"));
        operator.ifPresent(o -> workforce.add("Tell me about " + o));

        List<String> engineering = new ArrayList<>();
        bulletin.ifPresent(b -> {
            engineering.add("Show bulletin " + b);
            engineering.add("Balance " + b + " with 10 operators");
            engineering.add("How many operators are needed for 120 pieces per hour on " + b + "?");
        });
        operation.ifPresent(o -> engineering.add("What is the SMV of " + o + "?"));
        engineering.add("What is takt time?");

        List<String> production = new ArrayList<>();
        order.ifPresent(o -> production.add("What is the progress of order " + o + "?"));
        production.addAll(List.of("List orders in production", "Show production today", "Any alerts?"));

        return List.of(
                new PromptCategory("howto", "How-to", List.of("How do I balance a line?", "How do I add an operator?",
                        "How do I create a bulletin revision?", "How do I record production?")),
                new PromptCategory("workforce", "Workforce", workforce),
                new PromptCategory("engineering", "Engineering", engineering),
                new PromptCategory("production", "Orders & production", production),
                new PromptCategory("masters", "Masters", List.of("Give me a data overview", "List all sewing lines",
                        "How many machines do we have?", "List the shifts")));
    }

    /** Example questions built from records that really exist. */
    List<String> examples() {
        List<String> ex = new ArrayList<>();
        catalog.all(EntityType.ORDER).stream().findFirst().ifPresent(o -> ex.add("What is the progress of order " + o.display() + "?"));
        catalog.all(EntityType.OPERATION).stream().findFirst().ifPresent(o -> ex.add("Who are the best operators for " + o.display().replaceAll(" \\(.*\\)$", "") + "?"));
        catalog.all(EntityType.BULLETIN).stream().findFirst().ifPresent(b -> ex.add("Balance " + b.display() + " with 10 operators"));
        ex.add("Show today's attendance");
        return ex;
    }

    private static String titleCase(String s) {
        StringBuilder sb = new StringBuilder();
        for (String w : s.split(" ")) {
            if (w.isEmpty()) continue;
            if (sb.length() > 0) sb.append(' ');
            sb.append(w.matches(".*\\d.*") ? w.toUpperCase() : Character.toUpperCase(w.charAt(0)) + w.substring(1));
        }
        return sb.toString();
    }
}
