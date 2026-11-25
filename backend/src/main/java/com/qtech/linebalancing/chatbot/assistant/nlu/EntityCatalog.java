package com.qtech.linebalancing.chatbot.assistant.nlu;

import com.qtech.linebalancing.line.repository.SewingLineRepository;
import com.qtech.linebalancing.machine.repository.MachineRepository;
import com.qtech.linebalancing.operation.repository.OperationRepository;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.operationbulletin.repository.OperationBulletinRepository;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import com.qtech.linebalancing.order.repository.OrderRepository;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import com.qtech.linebalancing.style.repository.StyleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.*;

/**
 * Vocabulary of the application's own records (operators, operations, styles, lines, orders, bulletins, shifts,
 * buyers, machine types) used to recognise what a question is about. Everything the assistant can "know" an entity
 * by comes from the database, so it can never resolve a name to a record that does not exist.
 * Rebuilt at most every 30 seconds so newly created records become recognisable quickly.
 */
@Component
@RequiredArgsConstructor
public class EntityCatalog {

    private static final long TTL_MILLIS = 30_000;
    private static final int MAX_NGRAM = 7;

    /** Words that must never be treated as an entity alias on their own. */
    private static final Set<String> STOP = Set.of("a", "an", "the", "is", "of", "for", "in", "on", "to", "and", "or",
            "line", "order", "shift", "style", "operator", "operation", "bulletin", "machine", "all", "show", "list",
            "what", "who", "how", "many", "much", "today", "general", "main", "set", "make", "close", "left", "right");

    /** Common shop-floor abbreviations for machine types. */
    private static final Map<String, String> MACHINE_ABBREVIATIONS = Map.of(
            "snls", "single needle lockstitch", "dnls", "double needle lockstitch",
            "overlock", "4 thread overlock", "flatlock", "flatlock interlock", "interlock", "flatlock interlock",
            "bartack", "bar tack machine", "buttonhole", "buttonhole machine");

    private final OperatorRepository operatorRepository;
    private final OperationRepository operationRepository;
    private final StyleRepository styleRepository;
    private final SewingLineRepository lineRepository;
    private final OrderRepository orderRepository;
    private final OperationBulletinRepository bulletinRepository;
    private final ShiftRepository shiftRepository;
    private final MachineRepository machineRepository;
    private final PlatformTransactionManager transactionManager;

    /** A phrase found in the question and every record it could refer to. */
    public record Mention(String text, List<EntityRef> candidates, boolean fuzzy) {
    }

    private record Snapshot(long builtAt,
                            Map<String, Set<EntityRef>> aliases,
                            Map<String, Set<EntityRef>> fuzzyNames,
                            Map<String, EntityRef> byTypeAndKey,
                            Map<EntityType, List<EntityRef>> all) {
    }

    private volatile Snapshot snapshot;

    public void invalidate() {
        snapshot = null;
    }

    /** All records of a type (e.g. for "did you mean" suggestions). */
    public List<EntityRef> all(EntityType type) {
        return current().all().getOrDefault(type, List.of());
    }

    public Optional<EntityRef> find(EntityType type, String key) {
        if (key == null) return Optional.empty();
        return Optional.ofNullable(current().byTypeAndKey().get(type + ":" + key));
    }

    /** Finds every entity mention in a normalized question; longer phrases win over shorter ones. */
    public List<Mention> match(String normalizedQuestion) {
        Snapshot snap = current();
        List<String> tokens = Text.tokens(normalizedQuestion);
        boolean[] used = new boolean[tokens.size()];
        List<Mention> mentions = new ArrayList<>();

        for (int n = Math.min(MAX_NGRAM, tokens.size()); n >= 1; n--) {
            for (int i = 0; i + n <= tokens.size(); i++) {
                if (anyUsed(used, i, n)) continue;
                String gram = String.join(" ", tokens.subList(i, i + n));
                Set<EntityRef> refs = lookup(snap, gram);
                if (refs != null && !refs.isEmpty()) {
                    mentions.add(new Mention(gram, sorted(refs), false));
                    Arrays.fill(used, i, i + n, true);
                }
            }
        }

        // Typo-tolerant pass over what is left, for multi-letter names only ("sholder join", "priya sarma").
        for (int n = Math.min(4, tokens.size()); n >= 1; n--) {
            for (int i = 0; i + n <= tokens.size(); i++) {
                if (anyUsed(used, i, n)) continue;
                String gram = String.join(" ", tokens.subList(i, i + n));
                if (gram.replace(" ", "").length() < 5 || STOP.contains(gram)) continue;
                double threshold = n == 1 ? 0.88 : 0.84;
                String best = null;
                double bestScore = threshold;
                for (String name : snap.fuzzyNames().keySet()) {
                    if (Math.abs(name.length() - gram.length()) > 3) continue;
                    double score = Text.similarity(gram, name);
                    if (score >= bestScore) {
                        bestScore = score;
                        best = name;
                    }
                }
                if (best != null) {
                    mentions.add(new Mention(gram, sorted(snap.fuzzyNames().get(best)), true));
                    Arrays.fill(used, i, i + n, true);
                }
            }
        }
        return mentions;
    }

    /** Closest records of a type to a free-text name, for "not found — did you mean ...?" replies. */
    public List<EntityRef> suggest(EntityType type, String text, int limit) {
        String q = Text.normalize(text);
        return all(type).stream()
                .sorted(Comparator.comparingDouble((EntityRef r) -> -Text.similarity(q, Text.normalize(r.display()))))
                .limit(limit)
                .toList();
    }

    // ── building ─────────────────────────────────────────────────────────────────────

    private Snapshot current() {
        Snapshot s = snapshot;
        if (s == null || System.currentTimeMillis() - s.builtAt() > TTL_MILLIS) {
            synchronized (this) {
                s = snapshot;
                if (s == null || System.currentTimeMillis() - s.builtAt() > TTL_MILLIS) {
                    TransactionTemplate tx = new TransactionTemplate(transactionManager);
                    tx.setReadOnly(true);
                    s = tx.execute(status -> build());
                    snapshot = s;
                }
            }
        }
        return s;
    }

    private Snapshot build() {
        Builder b = new Builder();

        operatorRepository.findAll().forEach(o -> {
            EntityRef ref = new EntityRef(EntityType.OPERATOR, String.valueOf(o.getId()),
                    o.getName() + " (" + o.getEmployeeId() + ")");
            b.code(ref, o.getEmployeeId());
            b.name(ref, o.getName());
        });
        // Unique first names are accepted too ("Priya"), but only when exactly one operator has it.
        Map<String, List<EntityRef>> firstNames = new HashMap<>();
        operatorRepository.findAll().forEach(o -> {
            String first = Text.normalize(o.getName()).split(" ")[0];
            if (first.length() >= 4 && !STOP.contains(first)) {
                firstNames.computeIfAbsent(first, k -> new ArrayList<>())
                        .add(new EntityRef(EntityType.OPERATOR, String.valueOf(o.getId()), o.getName() + " (" + o.getEmployeeId() + ")"));
            }
        });
        firstNames.forEach((first, refs) -> refs.forEach(r -> b.alias(first, r)));

        operationRepository.findAll().forEach(op -> {
            EntityRef ref = new EntityRef(EntityType.OPERATION, String.valueOf(op.getId()), op.getName() + " (" + op.getOperationCode() + ")");
            b.code(ref, op.getOperationCode());
            b.name(ref, op.getName());
        });

        Set<String> buyers = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        styleRepository.findAll().forEach(st -> {
            EntityRef ref = new EntityRef(EntityType.STYLE, String.valueOf(st.getId()), st.getStyleNo());
            b.code(ref, st.getStyleNo());
            if (st.getBuyer() != null) buyers.add(st.getBuyer().trim());
        });
        orderRepository.findAll().forEach(o -> {
            EntityRef ref = new EntityRef(EntityType.ORDER, String.valueOf(o.getId()), o.getOrderNo());
            b.code(ref, o.getOrderNo());
            if (o.getBuyer() != null) buyers.add(o.getBuyer().trim());
        });
        Map<String, Integer> buyerFirstWordCount = new HashMap<>();
        buyers.forEach(by -> buyerFirstWordCount.merge(Text.normalize(by).split(" ")[0], 1, Integer::sum));
        buyers.forEach(by -> {
            EntityRef ref = new EntityRef(EntityType.BUYER, by, by);
            b.name(ref, by);
            String first = Text.normalize(by).split(" ")[0];
            if (first.length() >= 4 && buyerFirstWordCount.get(first) == 1 && !STOP.contains(first)) b.alias(first, ref);
        });

        lineRepository.findAll().forEach(l -> {
            EntityRef ref = new EntityRef(EntityType.LINE, String.valueOf(l.getId()), l.getLineCode() + " — " + l.getLineName());
            b.code(ref, l.getLineCode());
            if (l.getLineName() != null) {
                b.name(ref, l.getLineName());
                // "Line 01 - T-Shirt Assembly" is also known as "line 01" / "line 1"
                String head = Text.normalize(l.getLineName().split("[-–—]")[0]);
                if (head.matches("line \\d+")) b.code(ref, head);
            }
        });

        // Bulletin revisions share a code: the code means the live revision (released/published), else the latest.
        Map<String, OperationBulletin> preferred = new HashMap<>();
        for (OperationBulletin ob : bulletinRepository.findAll()) {
            String code = Text.compact(ob.getBulletinCode());
            OperationBulletin cur = preferred.get(code);
            if (cur == null || rank(ob) > rank(cur)) preferred.put(code, ob);
        }
        preferred.values().forEach(ob -> {
            EntityRef ref = new EntityRef(EntityType.BULLETIN, String.valueOf(ob.getId()), ob.getBulletinCode());
            b.code(ref, ob.getBulletinCode());
        });
        bulletinRepository.findAll().forEach(ob -> b.register(new EntityRef(EntityType.BULLETIN, String.valueOf(ob.getId()), ob.getBulletinCode())));

        shiftRepository.findAll().forEach(sh -> {
            EntityRef ref = new EntityRef(EntityType.SHIFT, String.valueOf(sh.getId()), sh.getShiftName() + " (" + sh.getShiftCode() + ")");
            String code = Text.normalize(sh.getShiftCode());
            b.alias(code + " shift", ref);
            b.alias("shift " + code, ref);
            if (code.length() > 1 && !STOP.contains(code)) b.alias(code, ref);
            String name = Text.normalize(sh.getShiftName());
            if (name.contains(" ")) b.alias(name, ref);
        });

        Set<String> machineTypes = new TreeSet<>();
        machineRepository.findAll().forEach(m -> { if (m.getMachineType() != null) machineTypes.add(m.getMachineType()); });
        operationRepository.findAll().forEach(op -> { if (op.getMachineType() != null) machineTypes.add(op.getMachineType()); });
        machineTypes.forEach(mt -> b.name(new EntityRef(EntityType.MACHINE_TYPE, mt, mt), mt));
        MACHINE_ABBREVIATIONS.forEach((abbr, full) -> machineTypes.stream()
                .filter(mt -> Text.normalize(mt).equals(full))
                .findFirst()
                .ifPresent(mt -> b.alias(abbr, new EntityRef(EntityType.MACHINE_TYPE, mt, mt))));

        return b.snapshot();
    }

    private static int rank(OperationBulletin ob) {
        int live = ob.getStatus() == OperationBulletin.Status.RELEASED || ob.getStatus() == OperationBulletin.Status.PUBLISHED ? 1_000_000 : 0;
        int rev = ob.getRevisionNumber() != null ? ob.getRevisionNumber() : 0;
        return live + rev * 1000 + (int) (ob.getId() % 1000);
    }

    private static Set<EntityRef> lookup(Snapshot snap, String gram) {
        Set<EntityRef> refs = snap.aliases().get(gram);
        if (refs == null) refs = snap.aliases().get(gram.replace(" ", ""));
        if (refs == null) refs = snap.aliases().get(Text.stripLeadingZeros(gram));
        if (refs == null) refs = snap.aliases().get(Text.stripLeadingZeros(gram).replace(" ", ""));
        return refs;
    }

    private static boolean anyUsed(boolean[] used, int from, int n) {
        for (int k = from; k < from + n; k++) if (used[k]) return true;
        return false;
    }

    private static List<EntityRef> sorted(Set<EntityRef> refs) {
        return refs.stream().sorted(Comparator.comparing(EntityRef::display)).toList();
    }

    /** Collects aliases; codes get compact and zero-stripped variants ("PO-2026-001" = "po2026001" = "po 2026 1"). */
    private static final class Builder {
        final Map<String, Set<EntityRef>> aliases = new HashMap<>();
        final Map<String, Set<EntityRef>> fuzzy = new HashMap<>();
        final Map<String, EntityRef> byKey = new HashMap<>();
        final Map<EntityType, Set<EntityRef>> all = new EnumMap<>(EntityType.class);

        void register(EntityRef ref) {
            byKey.putIfAbsent(ref.type() + ":" + ref.key(), ref);
        }

        void alias(String alias, EntityRef ref) {
            if (alias == null || alias.isBlank() || STOP.contains(alias)) return;
            aliases.computeIfAbsent(alias, k -> new LinkedHashSet<>()).add(ref);
            register(ref);
            all.computeIfAbsent(ref.type(), k -> new LinkedHashSet<>()).add(ref);
        }

        void code(EntityRef ref, String code) {
            if (code == null) return;
            String n = Text.normalize(code);
            alias(n, ref);
            alias(n.replace(" ", ""), ref);
            String stripped = Text.stripLeadingZeros(n);
            alias(stripped, ref);
            alias(stripped.replace(" ", ""), ref);
        }

        void name(EntityRef ref, String name) {
            if (name == null) return;
            String n = Text.normalize(name);
            alias(n, ref);
            if (n.length() >= 5) fuzzy.computeIfAbsent(n, k -> new LinkedHashSet<>()).add(ref);
        }

        Snapshot snapshot() {
            Map<EntityType, List<EntityRef>> allLists = new EnumMap<>(EntityType.class);
            all.forEach((t, set) -> allLists.put(t, set.stream().sorted(Comparator.comparing(EntityRef::display)).toList()));
            return new Snapshot(System.currentTimeMillis(), aliases, fuzzy, byKey, allLists);
        }
    }
}
