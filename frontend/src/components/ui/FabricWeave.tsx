/**
 * FabricWeave — a subtle, tileable SVG texture referencing the plain-weave
 * structure of woven fabric. Used as an ambient background element instead
 * of a flat color fill. Purely decorative, sits behind content (pointer-events: none).
 */
type FabricWeaveProps = {
    id: string;
    color?: string;
    opacity?: number;
    size?: number;
    className?: string;
};

const FabricWeave = ({
    id,
    color = '#0F172A',
    opacity = 0.035,
    size = 18,
    className = '',
}: FabricWeaveProps) => (
    <svg
        className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
        aria-hidden="true"
        focusable="false"
    >
        <defs>
            <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
                <path d={`M0 ${size / 2}H${size}`} stroke={color} strokeWidth="1" opacity="0.55" />
                <path d={`M${size / 2} 0V${size}`} stroke={color} strokeWidth="1" opacity="0.55" />
                <path d={`M0 0L${size} ${size}`} stroke={color} strokeWidth="0.6" opacity="0.35" />
                <path d={`M${size} 0L0 ${size}`} stroke={color} strokeWidth="0.6" opacity="0.35" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} style={{ opacity }} />
    </svg>
);

export default FabricWeave;
