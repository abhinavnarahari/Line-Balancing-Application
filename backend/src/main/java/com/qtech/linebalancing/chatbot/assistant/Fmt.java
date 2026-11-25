package com.qtech.linebalancing.chatbot.assistant;

import com.qtech.linebalancing.chatbot.dto.StructuredPayloadDto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Consistent number/date formatting and table payloads for answers. */
public final class Fmt {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);

    private Fmt() {
    }

    public static String num(Number n) {
        if (n == null) return "—";
        if (n instanceof BigDecimal bd) return dec(bd.doubleValue(), 2);
        if (n instanceof Double || n instanceof Float) return dec(n.doubleValue(), 2);
        return String.format(Locale.ENGLISH, "%,d", n.longValue());
    }

    /** Fixed decimals with trailing zeros removed: 3.70 -> "3.7", 41.111 -> "41.11". */
    public static String dec(double v, int decimals) {
        return BigDecimal.valueOf(v).setScale(decimals, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }

    public static String pct(double v) {
        return dec(v, 1) + "%";
    }

    public static String date(LocalDate d) {
        return d == null ? "—" : DATE.format(d);
    }

    public static String smv(BigDecimal minutes) {
        if (minutes == null) return "not set";
        return dec(minutes.doubleValue(), 4) + " min (" + dec(minutes.doubleValue() * 60, 1) + " s)";
    }

    public static String humanize(Object enumOrCode) {
        if (enumOrCode == null) return "—";
        String s = enumOrCode.toString().replace('_', ' ').toLowerCase(Locale.ENGLISH);
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    /** A TABLE payload; rows are rendered by the chat UI (and exportable). */
    public static StructuredPayloadDto table(String title, List<String> headers, List<List<Object>> rows) {
        List<Map<String, Object>> mapped = new ArrayList<>();
        for (List<Object> r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            for (int i = 0; i < headers.size(); i++) m.put(headers.get(i), i < r.size() && r.get(i) != null ? r.get(i) : "—");
            mapped.add(m);
        }
        return StructuredPayloadDto.builder().type("TABLE").title(title).headers(headers).rows(mapped).build();
    }

    /** A METRIC payload (key figures shown as tiles). */
    public static StructuredPayloadDto metrics(String title, Map<String, Object> metrics) {
        return StructuredPayloadDto.builder().type("METRIC").title(title).metrics(metrics).build();
    }

    /** Markdown table for small inline listings. */
    public static String mdTable(List<String> headers, List<List<Object>> rows) {
        StringBuilder sb = new StringBuilder("| ").append(String.join(" | ", headers)).append(" |\n|");
        headers.forEach(h -> sb.append("---|"));
        sb.append('\n');
        for (List<Object> r : rows) {
            sb.append("| ");
            for (int i = 0; i < headers.size(); i++) {
                Object v = i < r.size() ? r.get(i) : null;
                sb.append(v == null ? "—" : v.toString().replace("|", "/")).append(i < headers.size() - 1 ? " | " : " |");
            }
            sb.append('\n');
        }
        return sb.toString();
    }
}
