<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';

	interface Props {
		data: Array<{ date: string; value: number }>;
		color?: string;
		colorMap?: {
			level0: string;
			level1: string;
			level2: string;
			level3: string;
			level4: string;
		};
	}

	let {
		data,
		color = '#4caf50',
		colorMap
	}: Props = $props();

	let containerElement: HTMLElement;

	onMount(() => {
		// Scroll to the right (most recent data)
		if (containerElement) {
			containerElement.scrollLeft = containerElement.scrollWidth;
		}
	});

	// Generate past 26 weeks (182 days) - about 6 months
	const days = $derived.by(() => {
		const today = new Date();
		const startDate = new Date(today);
		// Go back to the most recent Sunday
		const dayOfWeek = startDate.getDay();
		startDate.setDate(startDate.getDate() - dayOfWeek);
		// Then go back 25 more weeks (26 weeks total)
		startDate.setDate(startDate.getDate() - 175);

		const result: Array<{ date: Date; value: number; dateStr: string; dayOfWeek: number }> = [];
		
		// Normalize dates to strings for the map
		const dataMap = new Map(
			data.map((d) => {
				const dateStr = typeof d.date === 'string' 
					? d.date 
					: d.date.toISOString().split('T')[0];
				return [dateStr, d.value];
			})
		);

		for (let i = 0; i < 182; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);
			const dateStr = date.toISOString().split('T')[0];
			const value = dataMap.get(dateStr) || 0;
			
			result.push({
				date,
				value,
				dateStr,
				dayOfWeek: date.getDay()
			});
		}

		return result;
	});

	// Group by weeks (columns)
	const weeks = $derived.by(() => {
		const result: typeof days[] = [];
		for (let i = 0; i < days.length; i += 7) {
			result.push(days.slice(i, i + 7));
		}
		return result;
	});

	// Month labels with week span
	const months = $derived.by(() => {
		const result: Array<{ label: string; weekStart: number; weekSpan: number }> = [];
		let currentMonth = -1;
		let monthStartWeek = 0;
		
		weeks.forEach((week, weekIndex) => {
			// Check the first day of the week (or middle day for better accuracy)
			const checkDay = week[3] || week[0];
			const month = checkDay.date.getMonth();
			
			if (month !== currentMonth) {
				if (currentMonth !== -1) {
					// Finalize previous month
					result[result.length - 1].weekSpan = weekIndex - monthStartWeek;
				}
				currentMonth = month;
				monthStartWeek = weekIndex;
				result.push({
					label: checkDay.date.toLocaleDateString('en-US', { month: 'short' }),
					weekStart: weekIndex,
					weekSpan: 1
				});
			}
		});
		
		// Finalize last month
		if (result.length > 0) {
			result[result.length - 1].weekSpan = weeks.length - monthStartWeek;
		}
		
		return result;
	});

	function getColor(value: number): string {
		const emptyColor = themeStore.value === 'dark' ? '#161b22' : '#ebedf0';

		// If colorMap is provided, use it
		if (colorMap) {
			if (value === 0) return colorMap.level0;
			// For binary values (0 or 1), treat 1 as 100%
			if (value === 1) return colorMap.level4;
			// For percentage values (0-100)
			if (value <= 25) return colorMap.level1;
			if (value <= 50) return colorMap.level2;
			if (value <= 75) return colorMap.level3;
			return colorMap.level4;
		} else {
			return value > 0 ? color : emptyColor;
		}
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	let hoveredDay: (typeof days)[0] | null = $state(null);
	let tooltipPosition = $state({ x: 0, y: 0 });

	function handleMouseEnter(day: (typeof days)[0], event: MouseEvent) {
		hoveredDay = day;
		const rect = (event.target as HTMLElement).getBoundingClientRect();
		tooltipPosition = {
			x: rect.left + rect.width / 2,
			y: rect.top - 10
		};
	}

	function handleMouseLeave() {
		hoveredDay = null;
	}
</script>

<div class="heat-map-container" bind:this={containerElement}>
	<div class="heat-map-header">
		{#each months as month}
			<div class="month-label" style="grid-column: {month.weekStart + 1} / span {month.weekSpan}">
				{month.label}
			</div>
		{/each}
	</div>
	
	<div class="heat-map-grid">
		<!-- Week columns -->
		{#each weeks as week}
			<div class="week-column">
				{#each week as day}
					<button
						class="day-cell"
						style="background-color: {getColor(day.value)}"
						onmouseenter={(e) => handleMouseEnter(day, e)}
						onmouseleave={handleMouseLeave}
						aria-label={formatDate(day.date)}
					></button>
				{/each}
			</div>
		{/each}
	</div>
</div>

{#if hoveredDay}
	<div class="tooltip" style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;">
		<div class="tooltip-content">
			{formatDate(hoveredDay.date)}
			{#if hoveredDay.value > 0}
				<span class="completed">
					{colorMap ? `${Math.round(hoveredDay.value)}%` : '✓'}
				</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.heat-map-container {
		width: 100%;
		overflow-x: auto;
		overflow-y: hidden;
		padding: 10px;
	}

	.heat-map-container::-webkit-scrollbar {
		height: 8px;
	}

	.heat-map-container::-webkit-scrollbar-track {
		background: rgb(var(--color-surface-variant) / 0.3);
		border-radius: 4px;
	}

	.heat-map-container::-webkit-scrollbar-thumb {
		background: rgb(var(--color-primary) / 0.5);
		border-radius: 4px;
	}

	.heat-map-container::-webkit-scrollbar-thumb:hover {
		background: rgb(var(--color-primary) / 0.7);
	}

	.heat-map-header {
		display: grid;
		grid-template-columns: repeat(26, 1fr);
		gap: 3px;
		margin-bottom: 8px;
		min-width: fit-content;
	}

	.month-label {
		font-size: 13px;
		font-weight: 600;
		color: rgb(var(--color-on-surface));
		opacity: 0.7;
		text-align: left;
	}

	.heat-map-grid {
		display: grid;
		grid-template-columns: repeat(26, 1fr);
		gap: 3px;
		align-items: start;
		min-width: fit-content;
	}

	.week-column {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.day-cell {
		width: 100%;
		aspect-ratio: 1;
		min-width: 12px;
		min-height: 12px;
		border-radius: 4px;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.day-cell:hover {
		transform: scale(1.15);
		outline: 2px solid rgba(255, 255, 255, 0.2);
		z-index: 10;
	}

	.tooltip {
		position: fixed;
		transform: translate(-50%, -100%);
		pointer-events: none;
		z-index: 1000;
	}

	.tooltip-content {
		background: rgb(var(--color-surface-variant));
		color: rgb(var(--color-on-surface-variant));
		padding: 8px 12px;
		border-radius: 8px;
		font-size: 12px;
		white-space: nowrap;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.completed {
		color: rgb(var(--color-primary));
		font-weight: bold;
	}

	@media (max-width: 768px) {
		.heat-map-container {
			padding: 8px;
		}

		.heat-map-grid,
		.heat-map-header {
			min-width: 600px;
		}
		
		.day-cell {
			min-width: 16px;
			min-height: 16px;
			border-radius: 3px;
		}
		
		.month-label {
			font-size: 11px;
		}
		
		.heat-map-grid {
			gap: 2px;
		}
		
		.week-column {
			gap: 2px;
		}
		
		.heat-map-header {
			gap: 2px;
		}
	}
</style>
