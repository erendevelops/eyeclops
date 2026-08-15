import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CircularTimer from "./CircularTimer";

describe("CircularTimer", () => {
  it("shows the remaining time and caption when running", () => {
    render(
      <CircularTimer
        status={{ elapsedSecs: 30, intervalSecs: 90, paused: false, onDuty: true }}
        offDutyLabel="Off duty"
        pausedLabel="Paused"
        ariaLabel="Break countdown timer"
        remainingCaption="until break"
      />,
    );
    expect(screen.getByText("01:00")).toBeInTheDocument();
    expect(screen.getByText("until break")).toBeInTheDocument();
  });

  it("shows the paused label when paused, without the remaining caption", () => {
    render(
      <CircularTimer
        status={{ elapsedSecs: 30, intervalSecs: 90, paused: true, onDuty: true }}
        offDutyLabel="Off duty"
        pausedLabel="Paused"
        ariaLabel="Break countdown timer"
        remainingCaption="until break"
      />,
    );
    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.queryByText("until break")).not.toBeInTheDocument();
  });

  it("shows the off-duty label when not on duty, without the remaining caption", () => {
    render(
      <CircularTimer
        status={{ elapsedSecs: 30, intervalSecs: 90, paused: false, onDuty: false }}
        offDutyLabel="Off duty"
        pausedLabel="Paused"
        ariaLabel="Break countdown timer"
        remainingCaption="until break"
      />,
    );
    expect(screen.getByText("Off duty")).toBeInTheDocument();
    expect(screen.queryByText("until break")).not.toBeInTheDocument();
  });

  it("renders nothing but doesn't crash when status is null", () => {
    const { container } = render(
      <CircularTimer
        status={null}
        offDutyLabel="Off duty"
        pausedLabel="Paused"
        ariaLabel="Break countdown timer"
        remainingCaption="until break"
      />,
    );
    expect(container).toBeInTheDocument();
  });

  it("uses the given ariaLabel prop", () => {
    render(
      <CircularTimer
        status={{ elapsedSecs: 0, intervalSecs: 90, paused: false, onDuty: true }}
        offDutyLabel="Off duty"
        pausedLabel="Paused"
        ariaLabel="Mola geri sayım zamanlayıcısı"
        remainingCaption="molaya kadar"
      />,
    );
    expect(
      screen.getByRole("img", { name: "Mola geri sayım zamanlayıcısı" }),
    ).toBeInTheDocument();
    expect(screen.getByText("molaya kadar")).toBeInTheDocument();
  });

  it("computes the arc offset proportional to elapsed progress", () => {
    const { container } = render(
      <CircularTimer
        status={{ elapsedSecs: 45, intervalSecs: 90, paused: false, onDuty: true }}
        offDutyLabel="Off duty"
        pausedLabel="Paused"
        ariaLabel="Break countdown timer"
        remainingCaption="until break"
      />,
    );
    const circles = container.querySelectorAll("circle");
    const progressArc = circles[1];
    const circumference = 2 * Math.PI * 85;
    // 50% elapsed -> half the circumference should remain as the offset.
    expect(Number(progressArc.getAttribute("stroke-dashoffset"))).toBeCloseTo(
      circumference / 2,
      5,
    );
  });
});
