import { SORT_OPTIONS } from '../lib/sort';

export default function SortSelect({ id, value, onChange }) {
  return (
    <div className="field field-inline">
      <label htmlFor={id}>Sort by</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
