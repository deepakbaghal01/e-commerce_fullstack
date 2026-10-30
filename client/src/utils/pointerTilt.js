export const updatePointerTilt = (event, intensity = 8) => {
  if (event.pointerType === 'touch') return;

  const { currentTarget, clientX, clientY } = event;
  const bounds = currentTarget.getBoundingClientRect();
  const x = (clientX - bounds.left) / bounds.width;
  const y = (clientY - bounds.top) / bounds.height;

  currentTarget.style.setProperty('--tilt-x', `${(0.5 - y) * intensity}deg`);
  currentTarget.style.setProperty('--tilt-y', `${(x - 0.5) * intensity}deg`);
  currentTarget.style.setProperty('--pointer-x', `${x * 100}%`);
  currentTarget.style.setProperty('--pointer-y', `${y * 100}%`);
};

export const resetPointerTilt = (event) => {
  const { currentTarget } = event;
  currentTarget.style.removeProperty('--tilt-x');
  currentTarget.style.removeProperty('--tilt-y');
  currentTarget.style.removeProperty('--pointer-x');
  currentTarget.style.removeProperty('--pointer-y');
};
