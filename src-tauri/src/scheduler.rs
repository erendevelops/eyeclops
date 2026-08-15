//! Pure break-timer logic, kept free of Tauri/async so it can be unit
//! tested deterministically (tick-by-tick) without spinning up a runtime.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SchedulerState {
    pub elapsed_secs: u64,
    pub paused: bool,
}

impl SchedulerState {
    pub fn new() -> Self {
        Self {
            elapsed_secs: 0,
            paused: false,
        }
    }

    /// Advance the scheduler by one second. Returns `true` if a break is
    /// due this tick (and resets the elapsed counter).
    ///
    /// `idle_secs` is how long the user has been away from keyboard/mouse;
    /// while idle for more than a few seconds, elapsed time doesn't
    /// accumulate, so breaks don't fire while nobody is at the screen.
    /// `on_duty` is whether the current time falls inside the configured
    /// working hours (always `true` when working hours are disabled).
    pub fn tick(&mut self, idle_secs: u64, interval_secs: u64, on_duty: bool) -> bool {
        const IDLE_THRESHOLD_SECS: u64 = 60;
        if self.paused || !on_duty || idle_secs >= IDLE_THRESHOLD_SECS || interval_secs == 0 {
            return false;
        }
        self.elapsed_secs += 1;
        if self.elapsed_secs >= interval_secs {
            self.elapsed_secs = 0;
            return true;
        }
        false
    }

    pub fn reset(&mut self) {
        self.elapsed_secs = 0;
    }

    /// Push the next break back by `snooze_secs`, relative to now.
    pub fn snooze(&mut self, interval_secs: u64, snooze_secs: u64) {
        self.elapsed_secs = interval_secs.saturating_sub(snooze_secs.min(interval_secs));
    }

    pub fn seconds_until_next_break(&self, interval_secs: u64) -> u64 {
        interval_secs.saturating_sub(self.elapsed_secs)
    }
}

impl Default for SchedulerState {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fires_exactly_after_interval_ticks() {
        let mut s = SchedulerState::new();
        for _ in 0..19 {
            assert!(!s.tick(0, 20, true));
        }
        assert!(s.tick(0, 20, true));
        assert_eq!(s.elapsed_secs, 0);
    }

    #[test]
    fn paused_never_fires() {
        let mut s = SchedulerState::new();
        s.paused = true;
        for _ in 0..100 {
            assert!(!s.tick(0, 20, true));
        }
        assert_eq!(s.elapsed_secs, 0);
    }

    #[test]
    fn idle_pauses_accumulation() {
        let mut s = SchedulerState::new();
        for _ in 0..100 {
            assert!(!s.tick(120, 20, true));
        }
        assert_eq!(s.elapsed_secs, 0);
    }

    #[test]
    fn brief_idle_below_threshold_still_accumulates() {
        let mut s = SchedulerState::new();
        for _ in 0..19 {
            assert!(!s.tick(5, 20, true));
        }
        assert!(s.tick(5, 20, true));
    }

    #[test]
    fn snooze_delays_next_fire() {
        let mut s = SchedulerState::new();
        for _ in 0..15 {
            s.tick(0, 20, true);
        }
        assert_eq!(s.elapsed_secs, 15);
        s.snooze(20, 300); // snooze longer than the interval clamps to 0 elapsed
        assert_eq!(s.elapsed_secs, 0);
        assert_eq!(s.seconds_until_next_break(20), 20);
    }

    #[test]
    fn reset_zeroes_elapsed() {
        let mut s = SchedulerState::new();
        s.tick(0, 20, true);
        s.reset();
        assert_eq!(s.elapsed_secs, 0);
    }

    #[test]
    fn off_duty_never_fires() {
        let mut s = SchedulerState::new();
        for _ in 0..100 {
            assert!(!s.tick(0, 20, false));
        }
        assert_eq!(s.elapsed_secs, 0);
    }

    #[test]
    fn resumes_accumulating_once_back_on_duty() {
        let mut s = SchedulerState::new();
        for _ in 0..10 {
            s.tick(0, 20, false);
        }
        assert_eq!(s.elapsed_secs, 0);
        for _ in 0..19 {
            assert!(!s.tick(0, 20, true));
        }
        assert!(s.tick(0, 20, true));
    }
}
