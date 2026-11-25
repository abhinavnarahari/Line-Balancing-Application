package com.qtech.linebalancing.common.skill;

/**
 * The factory's 4-level skill scale (quarters of the skill circle). Every rating in the system uses it.
 * <pre>
 *  1  In training             20-25% of target
 *  2  Needs supervisor help   40-50%
 *  3  Independent             60-70%  achieves target without help, solves problems
 *  4  Expert                  >70%    achieves target and can train others
 * </pre>
 */
public final class SkillScale {

    public static final int MIN = 1;
    public static final int MAX = 4;
    /** Level at which an operator can run the operation on their own ("certified"). */
    public static final int INDEPENDENT = 3;
    public static final int DEFAULT_REQUIRED = INDEPENDENT;

    private SkillScale() {}

    /** Efficiency (share of standard output) assumed for planning at each level. */
    public static double planningEfficiency(int rating) {
        return switch (clamp(rating)) {
            case 4 -> 0.75;
            case 3 -> 0.65;
            case 2 -> 0.45;
            default -> 0.25;
        };
    }

    /** Level for a measured efficiency (standard time / actual cycle time); band edges sit between the factory bands. */
    public static int ratingForEfficiency(double efficiency) {
        if (efficiency >= 0.70) return 4;
        if (efficiency >= 0.55) return 3;
        if (efficiency >= 0.33) return 2;
        return 1;
    }

    public static int clamp(int rating) {
        return Math.max(MIN, Math.min(MAX, rating));
    }

    public static String label(int rating) {
        return switch (clamp(rating)) {
            case 4 -> "Expert (trains others)";
            case 3 -> "Independent";
            case 2 -> "Needs supervisor help";
            default -> "In training";
        };
    }
}
