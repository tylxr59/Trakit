<script lang="ts">
	import HabitRow from '$lib/components/HabitRow.svelte';
	import CalendarGrid from '$lib/components/CalendarGrid.svelte';
	import ColorPicker from '$lib/components/ColorPicker.svelte';
	import Icon from '@iconify/svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { useAutoRefetch } from '$lib/swr.svelte';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();

	// Set up automatic data refresh on focus/reconnect
	onMount(() => {
		return useAutoRefetch();
	});

	// Create reactive values from server data
	let habits = $derived(data.habits);
	let aggregatedData = $derived(data.aggregatedData);
	let userTimezone = $derived(data.userTimezone || 'UTC');

	let showAddForm = $state(false);
	let showColorPicker = $state(false);
	let newHabitName = $state('');
	let newHabitColor = $state('#22C55E');
	let newHabitFrequency = $state('daily');

	// Get today's date in the user's timezone
	const today = $derived(new Date().toLocaleDateString('en-CA', { timeZone: userTimezone }));

	// Group habits by frequency
	const dailyHabits = $derived(habits.filter(h => h.frequency === 'daily'));
	const weeklyHabits = $derived(habits.filter(h => h.frequency === 'weekly'));
	const monthlyHabits = $derived(habits.filter(h => h.frequency === 'monthly'));

	// Drag and drop state
	let draggedIndex = $state<number | null>(null);
	let dropTargetIndex = $state<number | null>(null);

	function getTodayStamp(habitId: string) {
		const habit = habits.find((h) => h.id === habitId);
		if (!habit) return false;
		
		// For daily habits, check today's date
		if (habit.frequency === 'daily') {
			return habit.stamps.some((s) => s.date === today && s.value > 0);
		}
		
		// For weekly habits, check if there's any stamp in the current week
		if (habit.frequency === 'weekly') {
			const todayDate = new Date(today + 'T00:00:00');
			const startOfYear = new Date(todayDate.getFullYear(), 0, 1);
			const days = Math.floor((todayDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
			const currentWeek = Math.floor(days / 7);
			const currentWeekKey = `${todayDate.getFullYear()}-W${currentWeek}`;
			
			return habit.stamps.some((s) => {
				const stampDate = new Date(s.date + 'T00:00:00');
				const stampStartOfYear = new Date(stampDate.getFullYear(), 0, 1);
				const stampDays = Math.floor((stampDate.getTime() - stampStartOfYear.getTime()) / (24 * 60 * 60 * 1000));
				const stampWeek = Math.floor(stampDays / 7);
				const stampWeekKey = `${stampDate.getFullYear()}-W${stampWeek}`;
				return stampWeekKey === currentWeekKey && s.value > 0;
			});
		}
		
		// For monthly habits, check if there's any stamp in the current month
		if (habit.frequency === 'monthly') {
			const todayDate = new Date(today + 'T00:00:00');
			const currentMonthKey = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;
			
			return habit.stamps.some((s) => {
				const stampDate = new Date(s.date + 'T00:00:00');
				const stampMonthKey = `${stampDate.getFullYear()}-${String(stampDate.getMonth() + 1).padStart(2, '0')}`;
				return stampMonthKey === currentMonthKey && s.value > 0;
			});
		}
		
		return false;
	}

	async function toggleStamp(habitId: string) {
		const habit = habits.find((h) => h.id === habitId);
		if (!habit) return;
		
		const isStamped = getTodayStamp(habitId);
		
		// For weekly/monthly habits, when unchecking, we need to clear all stamps in the period
		if (isStamped && habit.frequency !== 'daily') {
			// Get all stamp dates in the current period
			const stampDatesToDelete: string[] = [];
			
			if (habit.frequency === 'weekly') {
				const todayDate = new Date(today + 'T00:00:00');
				const startOfYear = new Date(todayDate.getFullYear(), 0, 1);
				const days = Math.floor((todayDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
				const currentWeek = Math.floor(days / 7);
				const currentWeekKey = `${todayDate.getFullYear()}-W${currentWeek}`;
				
				habit.stamps.forEach((s) => {
					const stampDate = new Date(s.date + 'T00:00:00');
					const stampStartOfYear = new Date(stampDate.getFullYear(), 0, 1);
					const stampDays = Math.floor((stampDate.getTime() - stampStartOfYear.getTime()) / (24 * 60 * 60 * 1000));
					const stampWeek = Math.floor(stampDays / 7);
					const stampWeekKey = `${stampDate.getFullYear()}-W${stampWeek}`;
					if (stampWeekKey === currentWeekKey && s.value > 0) {
						stampDatesToDelete.push(s.date);
					}
				});
			} else if (habit.frequency === 'monthly') {
				const todayDate = new Date(today + 'T00:00:00');
				const currentMonthKey = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;
				
				habit.stamps.forEach((s) => {
					const stampDate = new Date(s.date + 'T00:00:00');
					const stampMonthKey = `${stampDate.getFullYear()}-${String(stampDate.getMonth() + 1).padStart(2, '0')}`;
					if (stampMonthKey === currentMonthKey && s.value > 0) {
						stampDatesToDelete.push(s.date);
					}
				});
			}
			
			// Delete all stamps in the period
			for (const dateToDelete of stampDatesToDelete) {
				await fetch('/api/stamp', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						habitId,
						date: dateToDelete,
						value: 0
					})
				});
			}
			
			// Update local state
			habits = habits.map((h) => {
				if (h.id === habitId) {
					return {
						...h,
						stamps: h.stamps.filter((s) => !stampDatesToDelete.includes(s.date))
					};
				}
				return h;
			});
			
			// Refresh to get updated streak
			await invalidateAll();
		} else {
			// For daily habits or when checking weekly/monthly habits, use today's date
			const response = await fetch('/api/stamp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					habitId,
					date: today,
					value: isStamped ? 0 : 1
				})
			});

			if (response.ok) {
				// Optimistic update - create new array to trigger reactivity
				habits = habits.map((h) => {
					if (h.id === habitId) {
						const existingStamp = h.stamps.find((s) => s.date === today);
						if (existingStamp) {
							// Update existing stamp
							return {
								...h,
								stamps: h.stamps.map((s) =>
									s.date === today ? { ...s, value: isStamped ? 0 : 1 } : s
								),
								currentStreak: isStamped ? Math.max(0, h.currentStreak - 1) : h.currentStreak + 1
							};
						} else {
							// Add new stamp
							return {
								...h,
								stamps: [...h.stamps, { date: today, value: 1 }],
								currentStreak: h.currentStreak + 1
							};
						}
					}
					return h;
				});

				// Recalculate aggregated data
				aggregatedData = recalculateAggregatedData();
			}
		}
	}

	function recalculateAggregatedData() {
		const aggregated = new Map<string, { date: string; value: number }>();
		
		// Get all unique dates from all habits
		const allDates = new Set<string>();
		habits.forEach((habit) => {
			habit.stamps.forEach((stamp) => {
				allDates.add(stamp.date);
			});
		});

		// Calculate completion percentage for each date
		allDates.forEach((date) => {
			let completedCount = 0;
			habits.forEach((habit) => {
				const stamp = habit.stamps.find((s) => s.date === date);
				if (stamp && stamp.value > 0) {
					completedCount++;
				}
			});

			const percentage = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;
			aggregated.set(date, { date, value: percentage });
		});

		return Array.from(aggregated.values());
	}

	// Drag and drop handlers
	function handleDragStart(event: DragEvent, index: number) {
		draggedIndex = index;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragEnd() {
		draggedIndex = null;
		dropTargetIndex = null;
	}

	function handleDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		
		// Update drop target if different from dragged item
		if (draggedIndex !== null && draggedIndex !== index) {
			dropTargetIndex = index;
		}
	}

	async function handleDrop(event: DragEvent, dropIndex: number) {
		event.preventDefault();
		
		if (draggedIndex === null || draggedIndex === dropIndex) {
			dropTargetIndex = null;
			draggedIndex = null;
			return;
		}

		// Reorder habits array
		const newHabits = [...habits];
		const [draggedHabit] = newHabits.splice(draggedIndex, 1);
		newHabits.splice(dropIndex, 0, draggedHabit);
		
		habits = newHabits;
		dropTargetIndex = null;
		draggedIndex = null;

		// Save new order to server
		const habitIds = habits.map((h) => h.id);
		await fetch('/api/reorder', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ habitIds })
		});
	}

	// Theme-aware color map for aggregated view
	const colorMap = $derived({
		level0: themeStore.value === 'dark' ? 'rgb(30 30 35)' : 'rgb(235 237 240)',
		level1: themeStore.value === 'dark' ? 'rgb(103 80 164 / 0.3)' : 'rgb(103 80 164 / 0.2)',
		level2: themeStore.value === 'dark' ? 'rgb(103 80 164 / 0.5)' : 'rgb(103 80 164 / 0.4)',
		level3: themeStore.value === 'dark' ? 'rgb(103 80 164 / 0.75)' : 'rgb(103 80 164 / 0.65)',
		level4: themeStore.value === 'dark' ? 'rgb(208 188 255)' : 'rgb(103 80 164)'
	});
</script>

<div class="container">
	<!-- Greeting Section -->
	{#if data.user?.displayName}
		<div class="greeting">
			<h2 class="greeting-text">
				<span>Hi {data.user.displayName}!</span>
				<Icon icon="material-symbols:waving-hand" width="32" />
			</h2>
		</div>
	{/if}

	<div class="page-header">
		<h1 class="page-title">Your Habits</h1>
		<button class="add-btn" onclick={() => (showAddForm = !showAddForm)}>
			<Icon icon="material-symbols:add" width="20" />
			<span class="btn-text">Add Habit</span>
		</button>
	</div>

	{#if showAddForm}
		<div class="add-form">
			<div class="add-form-row">
				<input
					type="text"
					bind:value={newHabitName}
					placeholder="Habit name"
					class="habit-input"
				/>
				<button
					type="button"
					class="color-button"
					style="background-color: {newHabitColor}"
					onclick={() => (showColorPicker = true)}
				>
					<Icon icon="material-symbols:palette-outline" width="20" />
				</button>
			</div>
			<select bind:value={newHabitFrequency} class="frequency-select">
				<option value="daily">Daily</option>
				<option value="weekly">Weekly</option>
				<option value="monthly">Monthly</option>
			</select>
			<div class="add-form-buttons">
				<button
					class="submit-btn"
					onclick={async () => {
						if (!newHabitName.trim()) return;
						
						const formData = new FormData();
						formData.append('name', newHabitName);
						formData.append('color', newHabitColor);
						formData.append('frequency', newHabitFrequency);
						
						const response = await fetch('?/createHabit', {
							method: 'POST',
							body: formData
						});
						
						if (response.ok) {
							showAddForm = false;
							newHabitName = '';
							newHabitColor = '#22C55E';
							newHabitFrequency = 'daily';
							// Refresh data to get new habit
							await invalidateAll();
						}
					}}
				>
					Create
				</button>
				<button type="button" class="cancel-btn" onclick={() => (showAddForm = false)}>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	{#if habits.length === 0}
		<div class="empty-state">
			<Icon icon="material-symbols:check-circle-outline" width="64" />
			<h2>No habits yet</h2>
			<p>Create your first habit to start tracking!</p>
		</div>
	{:else}
		<!-- Aggregated Calendar Grid -->
		<div class="aggregated-calendar">
			<h2 class="section-title">Activity Overview</h2>
			<CalendarGrid data={aggregatedData} {colorMap} />
			<div class="legend">
				<span class="legend-label">Less</span>
				<div class="legend-colors">
					<div class="legend-box" style="background-color: {colorMap.level0}"></div>
					<div class="legend-box" style="background-color: {colorMap.level1}"></div>
					<div class="legend-box" style="background-color: {colorMap.level2}"></div>
					<div class="legend-box" style="background-color: {colorMap.level3}"></div>
					<div class="legend-box" style="background-color: {colorMap.level4}"></div>
				</div>
				<span class="legend-label">More</span>
			</div>
		</div>

		<!-- Habit Rows by Frequency -->
		{#if dailyHabits.length > 0}
			<div class="habits-section">
				<h2 class="section-title">Daily Habits</h2>
				<div class="habits-list">
					{#each dailyHabits as habit (habit.id)}
						<div
							class="habit-wrapper"
							class:dragging={draggedIndex === habits.indexOf(habit)}
							class:drop-target={dropTargetIndex === habits.indexOf(habit) && draggedIndex !== habits.indexOf(habit)}
							draggable="true"
							role="button"
							tabindex="0"
							ondragstart={(e) => handleDragStart(e, habits.indexOf(habit))}
							ondragend={handleDragEnd}
							ondragover={(e) => handleDragOver(e, habits.indexOf(habit))}
							ondrop={(e) => handleDrop(e, habits.indexOf(habit))}
						>
							<HabitRow
								{habit}
								todayStamped={getTodayStamp(habit.id)}
								onToggleToday={() => toggleStamp(habit.id)}
								draggable={true}
							/>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if weeklyHabits.length > 0}
			<div class="habits-section">
				<h2 class="section-title">Weekly Habits</h2>
				<div class="habits-list">
					{#each weeklyHabits as habit (habit.id)}
						<div
							class="habit-wrapper"
							class:dragging={draggedIndex === habits.indexOf(habit)}
							class:drop-target={dropTargetIndex === habits.indexOf(habit) && draggedIndex !== habits.indexOf(habit)}
							draggable="true"
							role="button"
							tabindex="0"
							ondragstart={(e) => handleDragStart(e, habits.indexOf(habit))}
							ondragend={handleDragEnd}
							ondragover={(e) => handleDragOver(e, habits.indexOf(habit))}
							ondrop={(e) => handleDrop(e, habits.indexOf(habit))}
						>
							<HabitRow
								{habit}
								todayStamped={getTodayStamp(habit.id)}
								onToggleToday={() => toggleStamp(habit.id)}
								draggable={true}
							/>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if monthlyHabits.length > 0}
			<div class="habits-section">
				<h2 class="section-title">Monthly Habits</h2>
				<div class="habits-list">
					{#each monthlyHabits as habit (habit.id)}
						<div
							class="habit-wrapper"
							class:dragging={draggedIndex === habits.indexOf(habit)}
							class:drop-target={dropTargetIndex === habits.indexOf(habit) && draggedIndex !== habits.indexOf(habit)}
							draggable="true"
							role="button"
							tabindex="0"
							ondragstart={(e) => handleDragStart(e, habits.indexOf(habit))}
							ondragend={handleDragEnd}
							ondragover={(e) => handleDragOver(e, habits.indexOf(habit))}
							ondrop={(e) => handleDrop(e, habits.indexOf(habit))}
						>
							<HabitRow
								{habit}
								todayStamped={getTodayStamp(habit.id)}
								onToggleToday={() => toggleStamp(habit.id)}
								draggable={true}
							/>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Color Picker Modal -->
{#if showColorPicker}
	<ColorPicker
		selectedColor={newHabitColor}
		onSelect={(color) => (newHabitColor = color)}
		onClose={() => (showColorPicker = false)}
	/>
{/if}

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
	}

	.greeting {
		margin-bottom: 20px;
	}

	.greeting-text {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 28px;
		font-weight: 600;
		color: rgb(var(--color-on-surface));
		margin: 0;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32px;
	}

	.page-title {
		font-size: 20px;
		font-weight: 700;
		color: rgb(var(--color-on-background));
		margin: 0;
	}

	.add-btn {
		background: rgb(103 80 164 / 0.15);
		color: rgb(103 80 164);
		border: none;
		padding: 12px 24px;
		border-radius: 24px;
		cursor: pointer;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
		transition: all 0.2s;
	}

	.add-btn:hover {
		background: rgb(103 80 164 / 0.25);
	}

	@media (prefers-color-scheme: dark) {
		.add-btn {
			background: rgb(167 139 250 / 0.15);
			color: rgb(167 139 250);
		}

		.add-btn:hover {
			background: rgb(167 139 250 / 0.25);
		}
	}

	.add-form {
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-outline-variant));
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 24px;
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.add-form-row {
		display: contents;
	}

	.add-form-buttons {
		display: contents;
	}

	.habit-input {
		flex: 1;
		padding: 12px 16px;
		border: 1px solid rgb(var(--color-outline));
		border-radius: 8px;
		background: rgb(var(--color-background));
		color: rgb(var(--color-on-background));
		font-size: 16px;
	}

	.habit-input:focus {
		outline: 2px solid rgb(var(--color-primary));
		border-color: transparent;
	}

	.frequency-select {
		padding: 12px 16px;
		border: 1px solid rgb(var(--color-outline));
		border-radius: 8px;
		background: rgb(var(--color-background));
		color: rgb(var(--color-on-background));
		font-size: 16px;
		cursor: pointer;
		min-width: 120px;
	}

	.frequency-select:focus {
		outline: 2px solid rgb(var(--color-primary));
		border-color: transparent;
	}

	.color-button {
		width: 60px;
		height: 44px;
		border: 1px solid rgb(var(--color-outline));
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		transition: all 0.2s;
	}

	.color-button:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.submit-btn {
		background: rgb(var(--color-primary));
		color: rgb(var(--color-on-primary));
		border: none;
		padding: 12px 24px;
		border-radius: 20px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	.submit-btn:hover {
		background: rgb(var(--color-primary) / 0.9);
	}

	.cancel-btn {
		background: rgb(var(--color-surface-variant));
		color: rgb(var(--color-on-surface-variant));
		border: none;
		padding: 12px 24px;
		border-radius: 20px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	.cancel-btn:hover {
		background: rgb(var(--color-surface-variant) / 0.8);
	}

	.empty-state {
		text-align: center;
		padding: 80px 20px;
		color: rgb(var(--color-on-surface-variant));
	}

	.empty-state h2 {
		font-size: 24px;
		margin: 16px 0 8px;
		color: rgb(var(--color-on-surface));
	}

	.aggregated-calendar {
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-outline-variant));
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 32px;
	}

	.section-title {
		font-size: 20px;
		font-weight: 600;
		color: rgb(var(--color-on-surface));
		margin: 0 0 16px 0;
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 12px;
		font-size: 12px;
		color: rgb(var(--color-on-surface-variant));
	}

	.legend-label {
		font-weight: 500;
	}

	.legend-colors {
		display: flex;
		gap: 3px;
	}

	.legend-box {
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}

	.habits-section {
		margin-bottom: 32px;
	}

	.habits-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.habit-wrapper {
		position: relative;
	}

	.habit-wrapper.dragging {
		opacity: 0.4;
	}

	.habit-wrapper.drop-target {
		border-top: 3px solid rgb(var(--color-primary));
		padding-top: 3px;
		margin-top: -3px;
	}

	@media (max-width: 768px) {
		.greeting-text {
			font-size: 24px;
		}

		.page-header {
			flex-direction: row;
			align-items: center;
			gap: 16px;
			justify-content: space-between;
		}

		.page-title {
			font-size: 18px;
		}

		.add-btn .btn-text {
			display: none;
		}

		.add-btn {
			padding: 10px;
			border-radius: 50%;
			width: 40px;
			height: 40px;
			justify-content: center;
		}

		.add-form {
			flex-direction: column;
			gap: 12px;
		}

		.add-form-row {
			display: flex;
			gap: 12px;
			width: 100%;
		}

		.habit-input {
			flex: 1;
		}

		.color-button {
			width: 60px;
			min-width: 60px;
			height: 48px;
			flex-shrink: 0;
		}

		.frequency-select {
			width: 100%;
			min-width: unset;
		}

		.add-form-buttons {
			display: flex;
			gap: 12px;
			width: 100%;
		}

		.submit-btn,
		.cancel-btn {
			flex: 1;
			width: 50%;
		}

		.aggregated-calendar {
			padding: 16px;
		}

		.section-title {
			font-size: 18px;
		}
	}
</style>
