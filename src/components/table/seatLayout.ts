export function seatPosition(seatIndex: number, totalSeats: number, heroSeat: number): { left: string; top: string } {
  const relativeIndex = (seatIndex - heroSeat + totalSeats) % totalSeats;
  const angleDeg = 90 + (relativeIndex * 360) / totalSeats;
  const angleRad = (angleDeg * Math.PI) / 180;
  const rx = 42;
  const ry = 38;
  const left = 50 + rx * Math.cos(angleRad);
  const top = 50 + ry * Math.sin(angleRad);
  return { left: `${left}%`, top: `${top}%` };
}
