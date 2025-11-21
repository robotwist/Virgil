import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalculatorBox from './CalculatorBox';

describe('CalculatorBox', () => {
  it('renders calculator UI', () => {
    render(<CalculatorBox />);
    expect(screen.getByPlaceholderText(/enter math expression/i)).toBeInTheDocument();
    expect(screen.getByText(/calculate/i)).toBeInTheDocument();
  });

  it('shows result after calculation', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ result: 42 }) }));
    render(<CalculatorBox />);
    fireEvent.change(screen.getByPlaceholderText(/enter math expression/i), { target: { value: '6*7' } });
    fireEvent.click(screen.getByText(/calculate/i));
    await waitFor(() => expect(screen.getByText(/result: 42/i)).toBeInTheDocument());
  });
});
