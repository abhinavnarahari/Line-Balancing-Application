package com.qtech.linebalancing.chatbot.assistant.nlu;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Text normalisation and fuzzy-matching helpers shared by the question analyzer and the entity catalog. */
public final class Text {

    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9]+");
    private static final Pattern DIGIT_RUN = Pattern.compile("\\d+");

    private Text() {
    }

    /** Lower-case, punctuation to spaces, single-spaced: "LINE-01 (T-Shirt)" -> "line 01 t shirt". */
    public static String normalize(String s) {
        if (s == null) return "";
        return NON_ALNUM.matcher(s.toLowerCase(Locale.ROOT)).replaceAll(" ").trim();
    }

    /** Normalised with spaces removed: "PO-2026-001" -> "po2026001". */
    public static String compact(String s) {
        return normalize(s).replace(" ", "");
    }

    /** Drops leading zeros in every number: "line 01" -> "line 1", "emp 007" -> "emp 7". */
    public static String stripLeadingZeros(String normalized) {
        Matcher m = DIGIT_RUN.matcher(normalized);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String digits = m.group().replaceFirst("^0+(?=\\d)", "");
            m.appendReplacement(sb, digits);
        }
        m.appendTail(sb);
        return sb.toString();
    }

    public static List<String> tokens(String normalized) {
        if (normalized.isBlank()) return List.of();
        return new ArrayList<>(Arrays.asList(normalized.split(" ")));
    }

    /** Similarity in [0,1] based on Levenshtein distance. */
    public static double similarity(String a, String b) {
        if (a.equals(b)) return 1.0;
        int max = Math.max(a.length(), b.length());
        if (max == 0) return 1.0;
        return 1.0 - (double) levenshtein(a, b) / max;
    }

    static int levenshtein(String a, String b) {
        int[] prev = new int[b.length() + 1];
        int[] cur = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) prev[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            cur[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                cur[j] = Math.min(Math.min(cur[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] t = prev;
            prev = cur;
            cur = t;
        }
        return prev[b.length()];
    }

    /** True if the normalized text contains the phrase as whole words. */
    public static boolean hasPhrase(String normalizedText, String phrase) {
        return (" " + normalizedText + " ").contains(" " + phrase + " ");
    }
}
