import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders VenueIQ heading', () => {
    render(<App />);
    expect(screen.getByText('VenueIQ')).toBeInTheDocument();
  });

  it('shows Overview page by default', () => {
    render(<App />);
    expect(screen.getByText('Command Overview')).toBeInTheDocument();
  });

  it('displays expected capacity', () => {
    render(<App />);
    expect(screen.getByText('80,000')).toBeInTheDocument();
  });

  it('switches to Attendee view', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Attendee'));
    expect(screen.getByText('Grand Sports Arena')).toBeInTheDocument();
    expect(screen.getByText(/Block N/)).toBeInTheDocument();
  });

  it('navigates to Crowd Routing tab', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Crowd Routing'));
    expect(screen.getByText('Crowd-Aware Routing Map')).toBeInTheDocument();
  });

  it('navigates to Incident Command tab', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Incident Command'));
    expect(screen.getByText('Incident Command Workflow')).toBeInTheDocument();
    expect(screen.getByText(/INC-092/)).toBeInTheDocument();
  });

  it('resolves incident when Resolve clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Incident Command'));
    fireEvent.click(screen.getByText('Resolve'));
    expect(screen.getByText('All incidents resolved.')).toBeInTheDocument();
  });

  it('navigates to What-If Forecast', () => {
    render(<App />);
    fireEvent.click(screen.getByText('What-If Forecast'));
    expect(screen.getByText('What-If Forecasting')).toBeInTheDocument();
  });

  it('changes What-If scenario to +5M', () => {
    render(<App />);
    fireEvent.click(screen.getByText('What-If Forecast'));
    fireEvent.click(screen.getByText('+5 Mins (Surge)'));
    expect(screen.getByText('96%')).toBeInTheDocument();
    expect(screen.getByText(/Pre-deploy QRT/)).toBeInTheDocument();
  });

  it('navigates to Egress Waves', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Egress Waves'));
    expect(screen.getByText('Post-Match Egress Control')).toBeInTheDocument();
    expect(screen.getByText(/Wave 1/)).toBeInTheDocument();
  });

  it('has skip-to-content link for accessibility', () => {
    render(<App />);
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('has proper ARIA roles', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
