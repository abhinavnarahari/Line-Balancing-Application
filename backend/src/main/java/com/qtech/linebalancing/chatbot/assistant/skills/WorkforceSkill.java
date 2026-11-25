package com.qtech.linebalancing.chatbot.assistant.skills;

import com.qtech.linebalancing.attendance.entity.AttendanceRecord;
import com.qtech.linebalancing.attendance.repository.AttendanceRepository;
import com.qtech.linebalancing.chatbot.assistant.Answer;
import com.qtech.linebalancing.chatbot.assistant.Fmt;
import com.qtech.linebalancing.chatbot.assistant.nlu.AnalyzedQuestion;
import com.qtech.linebalancing.chatbot.assistant.nlu.EntityRef;
import com.qtech.linebalancing.chatbot.assistant.nlu.EntityType;
import com.qtech.linebalancing.chatbot.assistant.nlu.Intent;
import com.qtech.linebalancing.chatbot.assistant.nlu.Text;
import com.qtech.linebalancing.line.entity.SewingLine;
import com.qtech.linebalancing.line.repository.SewingLineRepository;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.repository.OperationRepository;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import com.qtech.linebalancing.shiftassignment.repository.ShiftAssignmentRepository;
import com.qtech.linebalancing.skillmatrix.entity.SkillAssessment;
import com.qtech.linebalancing.skillmatrix.repository.SkillAssessmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/** Operators, skills and attendance. */
@Component
@RequiredArgsConstructor
public class WorkforceSkill implements Skill {

    private static final List<String> SOURCE_OPERATORS = List.of("Operators master");

    private final OperatorRepository operatorRepository;
    private final OperationRepository operationRepository;
    private final SkillAssessmentRepository skillRepository;
    private final AttendanceRepository attendanceRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final SewingLineRepository lineRepository;

    @Override
    public Set<Intent> intents() {
        return EnumSet.of(Intent.OPERATOR_COUNT, Intent.OPERATOR_LIST, Intent.OPERATOR_PROFILE,
                Intent.TOP_OPERATORS_FOR_OPERATION, Intent.ATTENDANCE_SUMMARY);
    }

    @Override
    public Answer answer(AnalyzedQuestion q) {
        return switch (q.intent()) {
            case OPERATOR_COUNT -> count(q);
            case OPERATOR_LIST -> list(q);
            case OPERATOR_PROFILE -> profile(q);
            case TOP_OPERATORS_FOR_OPERATION -> topForOperation(q);
            default -> attendance(q);
        };
    }

    // ── filters ──────────────────────────────────────────────────────────────────

    private record Filtered(List<Operator> operators, String description) {
    }

    /** Active operators narrowed by role and department/line mentioned in the question. */
    private Filtered filtered(AnalyzedQuestion q) {
        List<Operator> ops = operatorRepository.findByActiveOrderByNameAsc(true);
        List<String> desc = new ArrayList<>();
        if (q.params().role() != null) {
            ops = ops.stream().filter(o -> o.getRole() != null && o.getRole().name().equals(q.params().role())).toList();
            desc.add(Fmt.humanize(q.params().role()).toLowerCase() + "s");
        }
        String department = departmentFor(q, ops);
        if (department != null) {
            String d = department;
            ops = ops.stream().filter(o -> d.equalsIgnoreCase(o.getDepartment())).toList();
            desc.add("in " + department);
        }
        return new Filtered(ops, String.join(" ", desc));
    }

    /** Department named in the question, or the "Sewing Line N" department of a mentioned sewing line. */
    private String departmentFor(AnalyzedQuestion q, List<Operator> scope) {
        Set<String> departments = operatorRepository.findByActiveOrderByNameAsc(true).stream()
                .map(Operator::getDepartment).filter(Objects::nonNull).collect(Collectors.toCollection(TreeSet::new));
        Optional<String> named = departments.stream()
                .filter(d -> Text.hasPhrase(q.normalized(), Text.normalize(d)))
                .max(Comparator.comparingInt(String::length));
        if (named.isPresent()) return named.get();
        if (q.has(EntityType.LINE)) {
            SewingLine line = lineRepository.findById(q.first(EntityType.LINE).get().id()).orElse(null);
            if (line != null) {
                String number = Text.stripLeadingZeros(Text.normalize(line.getLineCode())).replaceAll("\\D+", " ").trim();
                return departments.stream().filter(d -> Text.normalize(d).equals("sewing line " + number)).findFirst().orElse(null);
            }
        }
        return null;
    }

    // ── intents ──────────────────────────────────────────────────────────────────

    private Answer count(AnalyzedQuestion q) {
        Filtered f = filtered(q);
        long inactive = operatorRepository.count() - operatorRepository.findByActiveOrderByNameAsc(true).size();
        String what = f.description().isBlank() ? "active operators (all roles)" : "active " + f.description();
        StringBuilder text = new StringBuilder("There are **" + f.operators().size() + " " + what + "** in SewNexa.");
        if (f.description().isBlank() && inactive > 0) text.append(" ").append(inactive).append(" more are marked inactive.");

        Map<String, Long> byRole = f.operators().stream().collect(Collectors.groupingBy(
                o -> Fmt.humanize(o.getRole()), TreeMap::new, Collectors.counting()));
        Map<String, Long> byDept = f.operators().stream().collect(Collectors.groupingBy(
                o -> Objects.toString(o.getDepartment(), "—"), TreeMap::new, Collectors.counting()));
        if (byRole.size() > 1) {
            text.append("\n\n**By role:** ").append(byRole.entrySet().stream().map(e -> e.getKey() + " " + e.getValue()).collect(Collectors.joining(" · ")));
        }
        if (byDept.size() > 1) {
            text.append("\n\n**By department:** ").append(byDept.entrySet().stream().map(e -> e.getKey() + " " + e.getValue()).collect(Collectors.joining(" · ")));
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("Operators", f.operators().size());
        byRole.forEach(m::put);
        return Answer.of(text.toString(), SOURCE_OPERATORS, List.of("List all floaters", "Show today's attendance", "How many operators are in Sewing Line 1?"))
                .withPayload(Fmt.metrics("Operator headcount", m));
    }

    private Answer list(AnalyzedQuestion q) {
        Filtered f = filtered(q);
        if (f.operators().isEmpty()) {
            return Answer.notAvailable("No active " + (f.description().isBlank() ? "operators" : f.description()) + " were found.",
                    List.of("How many operators are there?"));
        }
        List<List<Object>> rows = f.operators().stream()
                .sorted(Comparator.comparing(Operator::getEmployeeId))
                .map(o -> List.<Object>of(o.getEmployeeId(), o.getName(), Fmt.humanize(o.getRole()), Objects.toString(o.getDepartment(), "—")))
                .toList();
        String title = "Active " + (f.description().isBlank() ? "operators" : f.description());
        String names = f.operators().size() <= 12
                ? ": " + f.operators().stream().map(o -> o.getName() + " (" + o.getEmployeeId() + ")").collect(Collectors.joining(", ")) + "."
                : ". The full list is in the table below.";
        return Answer.of("**" + f.operators().size() + "** " + title.toLowerCase() + names, SOURCE_OPERATORS,
                        List.of("How many operators are there?", "Show today's attendance"))
                .withPayload(Fmt.table(title, List.of("Employee ID", "Name", "Role", "Department"), rows));
    }

    private Answer profile(AnalyzedQuestion q) {
        Operator o = operatorRepository.findById(q.first(EntityType.OPERATOR).get().id()).orElseThrow();
        LocalDate today = LocalDate.now();
        StringBuilder t = new StringBuilder("### " + o.getName() + " (" + o.getEmployeeId() + ")\n\n");
        t.append("- **Role:** ").append(Fmt.humanize(o.getRole())).append("\n");
        t.append("- **Department:** ").append(Objects.toString(o.getDepartment(), "—")).append("\n");
        t.append("- **Status:** ").append(o.isActive() ? "Active" : "Inactive").append("\n");
        if (o.getJoiningDate() != null) t.append("- **Joined:** ").append(Fmt.date(o.getJoiningDate())).append("\n");
        if (o.getAge() != null) t.append("- **Age:** ").append(o.getAge()).append("\n");
        shiftAssignmentRepository.findCurrentAssignment(o.getId(), today).ifPresentOrElse(
                sa -> t.append("- **Current shift:** ").append(sa.getShift().getShiftName()).append(" (")
                        .append(sa.getShift().getStartTime()).append("–").append(sa.getShift().getEndTime()).append(")\n"),
                () -> t.append("- **Current shift:** no shift assignment covers today\n"));
        Optional<AttendanceRecord> att = attendanceRepository.findByAttendanceDateOrderByOperatorId(today).stream()
                .filter(a -> a.getOperator().getId().equals(o.getId())).findFirst();
        t.append("- **Attendance today:** ").append(att.map(a -> Fmt.humanize(a.getStatus())
                + (a.getCheckInTime() != null ? " (checked in " + a.getCheckInTime() + ")" : "")).orElse("not marked yet")).append("\n");

        List<SkillAssessment> skills = skillRepository.findByOperatorIdAndIsCurrentTrue(o.getId()).stream()
                .sorted(Comparator.comparing((SkillAssessment s) -> -nz(s.getRating()))
                        .thenComparing(s -> s.getOperation().getName()))
                .toList();
        if (skills.isEmpty()) {
            t.append("\nNo skill ratings are recorded for this operator yet.");
            return Answer.of(t.toString(), List.of("Operators master", "Shift assignments", "Attendance"), List.of("Who are the best operators for Shoulder Join?"));
        }
        t.append("\n**Skill matrix:** rated on ").append(skills.size()).append(" operations; strongest: ")
                .append(skills.stream().limit(3).map(s -> s.getOperation().getName() + " L" + s.getRating() + " " + com.qtech.linebalancing.common.skill.SkillScale.label(s.getRating())).collect(Collectors.joining(", ")))
                .append(".");
        List<List<Object>> rows = skills.stream().map(s -> List.<Object>of(s.getOperation().getOperationCode(), s.getOperation().getName(),
                "L" + s.getRating() + " " + com.qtech.linebalancing.common.skill.SkillScale.label(s.getRating()), s.getCycleTimeSeconds() != null ? s.getCycleTimeSeconds() + " s" : "—")).toList();
        return Answer.of(t.toString(), List.of("Operators master", "Skill matrix", "Shift assignments", "Attendance"),
                        List.of("Who are the best operators for " + skills.get(0).getOperation().getName() + "?", "Show today's attendance"))
                .withPayload(Fmt.table("Skill ratings — " + o.getName(), List.of("Code", "Operation", "Rating", "Cycle time"), rows));
    }

    private Answer topForOperation(AnalyzedQuestion q) {
        Operation op = operationRepository.findById(q.first(EntityType.OPERATION).get().id()).orElseThrow();
        List<SkillAssessment> ratings = skillRepository.findByOperationIdOrderByOperatorIdAscRevisionDesc(op.getId()).stream()
                .filter(SkillAssessment::isCurrent)
                .filter(s -> s.getOperator().isActive())
                .sorted(Comparator.comparing((SkillAssessment s) -> -nz(s.getRating()))
                        .thenComparing(s -> s.getCycleTimeSeconds() == null ? Integer.MAX_VALUE : s.getCycleTimeSeconds()))
                .toList();
        if (ratings.isEmpty()) {
            return Answer.notAvailable("No active operator has a skill rating for **" + op.getName() + " (" + op.getOperationCode()
                    + ")** yet. Ratings are recorded in the Skill Matrix ([open](/skill-matrix)).", List.of("Show operation " + op.getName()));
        }
        long expert = ratings.stream().filter(s -> nz(s.getRating()) >= 4).count();
        List<SkillAssessment> top = ratings.stream().limit(5).toList();
        StringBuilder t = new StringBuilder("Best operators for **" + op.getName() + " (" + op.getOperationCode() + ")**, by skill rating then cycle time:\n\n");
        for (int i = 0; i < top.size(); i++) {
            SkillAssessment s = top.get(i);
            t.append(i + 1).append(". **").append(s.getOperator().getName()).append("** (").append(s.getOperator().getEmployeeId())
                    .append(") — L").append(s.getRating()).append(" ").append(com.qtech.linebalancing.common.skill.SkillScale.label(s.getRating()))
                    .append(s.getCycleTimeSeconds() != null ? ", " + s.getCycleTimeSeconds() + " s cycle" : "").append("\n");
        }
        t.append("\n").append(expert).append(" of ").append(ratings.size()).append(" rated operators are experts (level 4 of 4).");
        if (op.getStandardSmv() != null) t.append(" Standard SMV is ").append(Fmt.smv(op.getStandardSmv())).append(".");
        List<List<Object>> rows = ratings.stream().map(s -> List.<Object>of(s.getOperator().getEmployeeId(), s.getOperator().getName(),
                "L" + s.getRating() + " " + com.qtech.linebalancing.common.skill.SkillScale.label(s.getRating()), s.getCycleTimeSeconds() != null ? s.getCycleTimeSeconds() + " s" : "—")).toList();
        return Answer.of(t.toString(), List.of("Skill matrix", "Operations master"),
                        List.of("Show " + top.get(0).getOperator().getName() + "'s profile", "What is the SMV of " + op.getName() + "?"))
                .withPayload(Fmt.table("Skill ratings — " + op.getName(), List.of("Employee ID", "Name", "Rating", "Cycle time"), rows));
    }

    private Answer attendance(AnalyzedQuestion q) {
        LocalDate date = q.params().date() != null ? q.params().date() : LocalDate.now();
        List<AttendanceRecord> records = attendanceRepository.findByAttendanceDateOrderByOperatorId(date);
        String day = date.equals(LocalDate.now()) ? "today (" + Fmt.date(date) + ")" : Fmt.date(date);

        if (q.has(EntityType.OPERATOR)) {
            EntityRef ref = q.first(EntityType.OPERATOR).get();
            Optional<AttendanceRecord> rec = records.stream().filter(a -> a.getOperator().getId().equals(ref.id())).findFirst();
            String text = rec.map(a -> "**" + ref.display() + "** was **" + Fmt.humanize(a.getStatus()).toLowerCase() + "** " + day
                            + (a.getCheckInTime() != null ? ", checked in at " + a.getCheckInTime() : "")
                            + (a.getCheckOutTime() != null ? ", checked out at " + a.getCheckOutTime() : "")
                            + " (" + a.getShift().getShiftName() + ").")
                    .orElse("No attendance has been marked for **" + ref.display() + "** " + day + ".");
            return rec.isPresent() ? Answer.of(text, List.of("Attendance"), List.of("Show attendance " + (date.equals(LocalDate.now()) ? "today" : "for " + date)))
                    : Answer.notAvailable(text, List.of("Show today's attendance"));
        }

        int active = operatorRepository.findByActiveOrderByNameAsc(true).size();
        if (records.isEmpty()) {
            return Answer.notAvailable("No attendance has been recorded for " + day + " yet, so all " + active
                    + " active operators are unmarked. Attendance is taken on the [Attendance](/attendance) page.", List.of("Show attendance for yesterday"));
        }
        Map<AttendanceRecord.Status, List<AttendanceRecord>> byStatus = records.stream()
                .collect(Collectors.groupingBy(AttendanceRecord::getStatus, () -> new EnumMap<>(AttendanceRecord.Status.class), Collectors.toList()));
        long marked = records.stream().map(a -> a.getOperator().getId()).distinct().count();
        StringBuilder t = new StringBuilder("Attendance for **" + day + "**: ");
        t.append(byStatus.entrySet().stream().map(e -> "**" + e.getValue().size() + "** " + Fmt.humanize(e.getKey()).toLowerCase())
                .collect(Collectors.joining(", "))).append(".");
        if (marked < active) t.append(" ").append(active - marked).append(" active operators are not marked yet.");
        for (AttendanceRecord.Status s : List.of(AttendanceRecord.Status.ABSENT, AttendanceRecord.Status.LATE, AttendanceRecord.Status.ON_LEAVE, AttendanceRecord.Status.HALF_DAY)) {
            List<AttendanceRecord> list = byStatus.getOrDefault(s, List.of());
            if (!list.isEmpty() && list.size() <= 15) {
                t.append("\n\n**").append(Fmt.humanize(s)).append(":** ")
                        .append(list.stream().map(a -> a.getOperator().getName() + " (" + a.getOperator().getEmployeeId() + ")").collect(Collectors.joining(", ")));
            }
        }
        Map<String, Object> m = new LinkedHashMap<>();
        byStatus.forEach((k, v) -> m.put(Fmt.humanize(k), v.size()));
        if (marked < active) m.put("Not marked", active - marked);
        return Answer.of(t.toString(), List.of("Attendance"), List.of("Who is absent today?", "Show attendance for yesterday"))
                .withPayload(Fmt.metrics("Attendance — " + Fmt.date(date), m));
    }

    private static int nz(Integer v) {
        return v == null ? 0 : v;
    }
}
