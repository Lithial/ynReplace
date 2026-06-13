const STEPS = ["Story", "Values", "Read & export"];

export function StepBar({
  current,
  onChange,
}: {
  current: number;
  onChange: (step: number) => void;
}) {
  return (
    <nav className="stepbar">
      {STEPS.map((label, index) => (
        <button
          key={label}
          type="button"
          aria-current={index === current}
          onClick={() => onChange(index)}
        >
          {index + 1}. {label}
        </button>
      ))}
    </nav>
  );
}
