"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * <CountUp value={1234} suffix="만" duration={900} />
 * - target 숫자까지 부드럽게 카운트업
 * - decimals: 소수점 자리
 * - 한국어 천 단위 콤마 자동
 */
export function CountUp({ value = 0, suffix = "", prefix = "", duration = 800, decimals = 0, className = "" }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const target = Number(value) || 0;
    cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    const from = 0;

    const tick = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = from + (target - from) * eased;
      setDisplay(cur);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else setDisplay(target);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  const formatted = decimals > 0
    ? Number(display).toFixed(decimals)
    : Math.round(display).toLocaleString();

  return <span className={`num ${className}`}>{prefix}{formatted}{suffix}</span>;
}

/**
 * <Spotlight as="div" className="surface-card">...</Spotlight>
 * 마우스 위치 추적 → CSS 변수 --mx/--my 업데이트.
 * .spotlight 클래스의 ::before 라이트가 따라움직임.
 */
export function Spotlight({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useRef(null);
  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  };
  return (
    <Tag ref={ref} onMouseMove={handleMove} className={`spotlight ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * <LiveDot variant="success" /> 펄스 도트
 */
export function LiveDot({ variant = "success", label }) {
  const cls = variant === "warn" ? "pulse-dot pulse-dot-warn"
            : variant === "danger" ? "pulse-dot pulse-dot-danger"
            : variant === "purple" ? "pulse-dot pulse-dot-purple"
            : "pulse-dot";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-muted)" }}>
      <span className={cls} />
      {label && <span>{label}</span>}
    </span>
  );
}

/**
 * 모바일 FAB
 * <FAB onClick={...} icon="+" label="등록" />
 */
export function FAB({ onClick, icon = "+", label, ariaLabel }) {
  return (
    <button onClick={onClick} className="fab" aria-label={ariaLabel || label || "추가"} title={label}>
      {icon}
    </button>
  );
}

/**
 * 3D Tilt — mouseMove → rotateX/Y, spring 으로 부드럽게.
 * Spotlight glow 와 결합되어 입체감 + 라이트가 마우스를 따라옴.
 * <Tilt as="div" className="surface-card interactive">...</Tilt>
 *
 * intensity: 회전 강도 (기본 8도)
 */
export function Tilt({ as: Tag = "div", className = "", intensity = 8, children, ...rest }) {
  const ref = useRef(null);
  const mx = useMotionValue(0); // -1 ~ 1
  const my = useMotionValue(0);
  const rx = useTransform(my, [-1, 1], [intensity, -intensity]);
  const ry = useTransform(mx, [-1, 1], [-intensity, intensity]);
  const sRx = useSpring(rx, { stiffness: 250, damping: 22, mass: 0.6 });
  const sRy = useSpring(ry, { stiffness: 250, damping: 22, mass: 0.6 });

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    mx.set(px * 2 - 1);
    my.set(py * 2 - 1);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };
  const handleLeave = () => {
    mx.set(0); my.set(0);
  };

  const MotionTag = motion[Tag] || motion.div;
  return (
    <MotionTag
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`spotlight ${className}`}
      style={{ rotateX: sRx, rotateY: sRy, transformStyle: "preserve-3d", transformPerspective: 1000, willChange: "transform" }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/**
 * 페이지 진입 stagger — 자식들을 순차 fade-up
 * <FadeIn>...<FadeIn.Item>...</FadeIn.Item></FadeIn>
 * 또는 그냥 <FadeIn>{children}</FadeIn> 으로 묶어두면 직접 자식이 stagger
 */
const fadeInContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const fadeInItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 24 } },
};
export function FadeIn({ children, className = "", ...rest }) {
  return (
    <motion.div variants={fadeInContainer} initial="hidden" animate="show" className={className} {...rest}>
      {children}
    </motion.div>
  );
}
FadeIn.Item = function FadeInItem({ children, className = "", ...rest }) {
  return (
    <motion.div variants={fadeInItem} className={className} {...rest}>
      {children}
    </motion.div>
  );
};

/**
 * Hover lift wrapper — 카드를 motion.div 로 감싸 부드러운 lift
 */
export function HoverLift({ as: Tag = "div", className = "", lift = -4, children, ...rest }) {
  const MotionTag = motion[Tag] || motion.div;
  return (
    <MotionTag
      whileHover={{ y: lift, transition: { type: "spring", stiffness: 320, damping: 22 } }}
      whileTap={{ scale: 0.98 }}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
