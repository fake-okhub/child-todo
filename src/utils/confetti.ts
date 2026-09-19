import confetti from 'canvas-confetti';

export function fireCelebrationConfetti() {
  // Center blast
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FF3C28', '#00C3E3', '#F59E0B', '#10B981', '#8B5CF6'],
  });

  // Left & right bursts
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#FF3C28', '#F59E0B', '#00C3E3'],
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#00C3E3', '#10B981', '#8B5CF6'],
    });
  }, 200);
}
