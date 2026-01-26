export const getRankInfo = (total) => {
  if (total >= 100) return { name: 'ACE PILOT', next: 'Legend', target: 200, icon: 'star' };
  if (total >= 50) return { name: 'COMMANDER', next: 'Ace Pilot', target: 100, icon: 'shield-checkmark' };
  if (total >= 20) return { name: 'OFFICER', next: 'Commander', target: 50, icon: 'medal' };
  if (total >= 5) return { name: 'ROOKIE', next: 'Officer', target: 20, icon: 'airplane' };
  return { name: 'CADET', next: 'Rookie', target: 5, icon: 'leaf' };
};
