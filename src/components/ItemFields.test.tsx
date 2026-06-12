import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ItemFields, type EditableFood } from './ItemFields';

const base: EditableFood = {
  name: 'Burrito',
  emoji: '🌯',
  portion: '1 large',
  kcal: 800,
  protein: 35,
  carbs: 90,
  fat: 30,
  fiber: 10,
  sugar: 6,
  sodium: 1400,
  confidence: 'medium',
};

function Harness({ onItem }: { onItem?: (i: EditableFood) => void }) {
  const [item, setItem] = useState(base);
  return (
    <ItemFields
      item={item}
      onChange={(next) => {
        setItem(next);
        onItem?.(next);
      }}
    />
  );
}

describe('ItemFields', () => {
  it('renders all editable nutrient fields', () => {
    render(<Harness />);
    expect(screen.getByLabelText('Food name')).toHaveValue('Burrito');
    expect(screen.getByLabelText('kcal')).toHaveValue(800);
    expect(screen.getByLabelText('Protein g')).toHaveValue(35);
    expect(screen.getByLabelText('Sodium mg')).toHaveValue(1400);
  });

  it('shows the AI confidence badge', () => {
    render(<Harness />);
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('lets the user correct an AI estimate', () => {
    let latest: EditableFood | undefined;
    render(<Harness onItem={(i) => (latest = i)} />);
    fireEvent.change(screen.getByLabelText('kcal'), { target: { value: '650' } });
    expect(latest?.kcal).toBe(650);
    fireEvent.change(screen.getByLabelText('Food name'), { target: { value: 'Chicken burrito' } });
    expect(latest?.name).toBe('Chicken burrito');
  });

  it('coerces invalid numeric input to 0 instead of NaN', () => {
    let latest: EditableFood | undefined;
    render(<Harness onItem={(i) => (latest = i)} />);
    fireEvent.change(screen.getByLabelText('kcal'), { target: { value: '-12' } });
    expect(latest?.kcal).toBe(0);
  });
});
