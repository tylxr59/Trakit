<script lang="ts">
	interface Props {
		selectedColor: string;
		onSelect: (color: string) => void;
		onClose: () => void;
	}

	let { selectedColor, onSelect, onClose }: Props = $props();

	const colors = [
		'#EF4444', // Red
		'#F97316', // Orange
		'#F59E0B', // Amber
		'#EAB308', // Yellow
		'#84CC16', // Lime
		'#22C55E', // Green
		'#10B981', // Emerald
		'#14B8A6', // Teal
		'#06B6D4', // Cyan
		'#0EA5E9', // Sky
		'#3B82F6', // Blue
		'#6366F1', // Indigo
		'#8B5CF6', // Violet
		'#A855F7', // Purple
		'#D946EF', // Fuchsia
		'#EC4899', // Pink
		'#F43F5E', // Rose
		'#64748B' // Slate
	];

	function handleSelect(color: string) {
		onSelect(color);
		onClose();
	}
</script>

<div class="overlay" role="button" tabindex="0" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()}>
	<div class="picker" role="dialog" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
		<h3 class="title">Choose a color</h3>
		<div class="colors-grid">
			{#each colors as color}
				<button
					class="color-option"
					class:selected={color === selectedColor}
					style="background-color: {color}"
					onclick={() => handleSelect(color)}
					aria-label="Select {color}"
				>
					{#if color === selectedColor}
						<svg
							width="20"
							height="20"
							viewBox="0 0 20 20"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M16.6667 5L7.50004 14.1667L3.33337 10"
								stroke="white"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}

	.picker {
		background: rgb(var(--color-surface));
		border-radius: 16px;
		padding: 24px;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	}

	.title {
		font-size: 20px;
		font-weight: 600;
		color: rgb(var(--color-on-surface));
		margin: 0 0 20px 0;
	}

	.colors-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 12px;
	}

	.color-option {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: 3px solid transparent;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.color-option:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.color-option.selected {
		border-color: rgb(var(--color-on-surface));
		box-shadow: 0 0 0 2px rgb(var(--color-surface)), 0 0 0 4px rgb(var(--color-primary));
	}

	@media (max-width: 640px) {
		.colors-grid {
			grid-template-columns: repeat(4, 1fr);
			gap: 10px;
		}

		.color-option {
			width: 44px;
			height: 44px;
		}
	}
</style>
