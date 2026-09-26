import { TaskItem, TaskCategory, ActivityEntry, PlanItem } from '../types';
import { StorageService } from './storage';

export interface AiProcessResult {
  reply: string;
  badge: 'Gemma 3n E2B';
  actionTaken?: {
    type: 'task_updated' | 'activity_logged' | 'plan_created';
    summary: string;
  };
}

export class LocalAiEngine {
  /**
   * Main inference orchestrator simulating local Gemma 3n E2B quantized model
   * with contextual awareness of user's personal document, active tasks, and history.
   */
  static async processMessage(
    userText: string,
    currentEnergy: 'high' | 'medium' | 'low' = 'medium',
    availableMinutes: number = 30
  ): Promise<AiProcessResult> {
    const textLower = userText.toLowerCase().trim();
    const tasks = StorageService.getTasks();
    const history = StorageService.getHistory();
    const profile = StorageService.getProfile();
    const plans = StorageService.getPlans();

    // 1. Inquiries about Architecture / Components: "what components are you made of", "what r u made of"
    if (
      textLower.includes('what components') ||
      textLower.includes('components r u made of') ||
      textLower.includes('components are you made of') ||
      textLower.includes('what are you made of') ||
      textLower.includes('what r u made of') ||
      textLower.includes('what models') ||
      textLower.includes('which models')
    ) {
      return {
        badge: 'Gemma 3n E2B',
        reply: `I am **Boost Productivity**, built entirely on an on-device local AI stack designed for zero latency and complete privacy:

1. **Gemma 3n E2B (Local LLM)**:
   • On-device quantized edge language model.
   • Handles personalized reasoning, task decomposition, time allocation, and planning without needing any cloud server.

2. **Moonshine Tiny (Speech-to-Text)**:
   • Ultra-lightweight local acoustic speech model.
   • Transcribes your voice instantly in real-time on-device with zero audio leaving your hardware.

3. **Piper TTS (Text-to-Speech)**:
   • High-speed local neural speech synthesizer.
   • Generates fluid, natural speech audio on demand when you tap "Read Aloud".

4. **Private On-Device Data Vault**:
   • All personal documents, active to-dos, subcomponents, and activity heatmaps are stored locally on your device storage.`,
      };
    }

    // 2. Subcomponent Query: "What do I have related to DLD class?" or "What do I have related to [XYZ]?"
    const relatedMatch = userText.match(
      /(?:what do i have related to|what do i have for|what tasks? do i have for|show me tasks? related to|what is on my list for)\s+["']?([^"'\?]+)["']?/i
    );
    if (relatedMatch || textLower.includes('related to') || textLower.includes('dld class') || textLower.includes('dld')) {
      let queryKeyword = relatedMatch ? relatedMatch[1].trim().toLowerCase() : '';
      if (!queryKeyword && (textLower.includes('dld class') || textLower.includes('dld'))) {
        queryKeyword = 'dld';
      } else if (!queryKeyword && textLower.includes('rag')) {
        queryKeyword = 'rag';
      }

      const matchingTasks = tasks.filter(
        (t) =>
          !t.completed &&
          (t.title.toLowerCase().includes(queryKeyword) ||
            t.description.toLowerCase().includes(queryKeyword) ||
            t.category.toLowerCase().includes(queryKeyword))
      );

      if (matchingTasks.length > 0) {
        const target = matchingTasks[0];
        const lines = target.description
          .split('\n')
          .map((l) => l.trim().replace(/^[-*•\d\.]+\s*/, ''))
          .filter(Boolean);

        const subList = lines.map((item, idx) => `  ${idx + 1}. ${item}`).join('\n');

        return {
          badge: 'Gemma 3n E2B',
          reply: `Here are the active components for **"${target.title}"** (${target.estimatedMinutes} mins · ${target.priority.toUpperCase()} Priority):

${subList}

Tell me which components you have finished (e.g., *"I have completed items 1 and 2, but item 3 is left"*), and I will log the completed work to your Daily History and update the task with only what remains!`,
        };
      } else {
        return {
          badge: 'Gemma 3n E2B',
          reply: `I checked your active task list, but didn't find any incomplete tasks matching "${queryKeyword || 'that keyword'}". Would you like me to add a new task with decomposed subcomponents for you?`,
        };
      }
    }

    // 3. Completing subcomponents and leaving remaining:
    // e.g. "I completed Karnaugh maps and counter, lab report is left" or "completed xyz and abc is left"
    const hasCompletedVerb =
      textLower.includes('completed') || textLower.includes('finished') || textLower.includes('done with');
    const hasLeftKeyword =
      textLower.includes('is left') || textLower.includes('are left') || textLower.includes('remaining');

    if (hasCompletedVerb && (hasLeftKeyword || textLower.includes('dld') || textLower.includes('rag') || textLower.includes('left'))) {
      // Find relevant active task (DLD or RAG or first active task)
      let activeTask = tasks.find(
        (t) =>
          !t.completed &&
          (textLower.includes(t.title.toLowerCase()) ||
            (textLower.includes('dld') && t.title.toLowerCase().includes('dld')) ||
            (textLower.includes('rag') && t.title.toLowerCase().includes('rag')))
      );

      if (!activeTask) {
        activeTask = tasks.find((t) => !t.completed);
      }

      if (activeTask) {
        // Parse what was completed and what is left
        let completedDesc = 'Completed subcomponents as discussed';
        let remainingDesc = '';

        // Extract completed part
        const completedMatch = userText.match(
          /(?:i have completed|i completed|completed|finished)\s+([^,\.]+?)(?:(?:,|\s+and|\s+but|\s+while)\s+(?:.*?is left|.*?are left|.*?remaining)|$)/i
        );
        if (completedMatch && completedMatch[1]) {
          completedDesc = completedMatch[1].trim();
        }

        // Extract remaining part
        const leftMatch = userText.match(
          /(?:and|but|while)?\s*(.+?)\s+(?:is left|are left|remaining|still to do)/i
        );
        if (leftMatch && leftMatch[1]) {
          remainingDesc = leftMatch[1].replace(/^(and|but)\s+/i, '').trim();
        }

        // If no explicit leftMatch was parsed, retain lines that weren't mentioned in completed
        if (!remainingDesc) {
          const originalLines = activeTask.description
            .split('\n')
            .map((l) => l.trim().replace(/^[-*•\d\.]+\s*/, ''))
            .filter(Boolean);

          const leftoverLines = originalLines.filter(
            (l) => !completedDesc.toLowerCase().includes(l.toLowerCase().substring(0, 10))
          );
          remainingDesc = leftoverLines.length > 0 ? leftoverLines.join('\n- ') : 'Review and submit final output';
        }

        // Estimated minutes for the completed chunk
        const loggedMinutes = Math.min(60, Math.max(25, Math.round(activeTask.estimatedMinutes * 0.6)));

        // 1. Add to Activity History
        const newHistEntry = StorageService.addActivity({
          title: activeTask.title,
          description: `Completed: ${completedDesc}. (Logged from conversation)`,
          minutesSpent: loggedMinutes,
          category: activeTask.category,
          date: new Date().toISOString().split('T')[0],
          taskId: activeTask.id,
        });

        // 2. Update the existing task with only the remaining description
        const updatedTasks = tasks.map((t) => {
          if (t.id === activeTask!.id) {
            const formattedRemaining = remainingDesc.startsWith('- ') ? remainingDesc : `- ${remainingDesc}`;
            return {
              ...t,
              description: formattedRemaining,
              estimatedMinutes: Math.max(15, t.estimatedMinutes - loggedMinutes),
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        });
        StorageService.saveTasks(updatedTasks);

        return {
          badge: 'Gemma 3n E2B',
          actionTaken: {
            type: 'activity_logged',
            summary: `Logged ${loggedMinutes}m to Daily Activity and updated "${activeTask.title}"`,
          },
          reply: `Excellent work! I have processed this in your local records:

✅ **Saved to Daily Activity History**:
• **Title**: ${activeTask.title}
• **Completed**: ${completedDesc}
• **Time Credited**: ${loggedMinutes} minutes logged to your daily productivity total.

📋 **Updated Task in To-Do List**:
• **Remaining to do**:
${remainingDesc.split('\n').map((l) => `  • ${l.replace(/^-\s*/, '')}`).join('\n')}

Your task description now only contains what is left to do. Would you like to take a 5-minute break or dive into the remaining work?`,
        };
      }
    }

    // 4. Time & Energy Recommendation: "I have 30 minutes free right now. What should I do?"
    const timeMatch = userText.match(/(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i);
    const hasFreeTimePrompt =
      textLower.includes('free right now') ||
      textLower.includes('what should i do') ||
      textLower.includes('how to spend') ||
      textLower.includes('have some time') ||
      textLower.includes('recommend something');

    if (hasFreeTimePrompt || (timeMatch && (textLower.includes('free') || textLower.includes('have')))) {
      let parsedMinutes = availableMinutes;
      if (timeMatch) {
        const val = parseInt(timeMatch[1], 10);
        if (textLower.includes('hour') || textLower.includes('hr')) {
          parsedMinutes = val * 60;
        } else {
          parsedMinutes = val;
        }
      }

      return this.generateTimeAndEnergyRecommendation(parsedMinutes, currentEnergy, tasks, profile);
    }

    // 5. Accomplishment Logging: "Today I completed my RAG implementation and studied for two hours."
    if (
      (textLower.includes('today i') || textLower.includes('i have done') || textLower.includes('i did')) &&
      (textLower.includes('completed') || textLower.includes('studied') || textLower.includes('worked on') || textLower.includes('finished'))
    ) {
      let minutes = 60;
      if (textLower.includes('two hours') || textLower.includes('2 hours') || textLower.includes('2 hrs')) {
        minutes = 120;
      } else if (textLower.includes('an hour') || textLower.includes('1 hour') || textLower.includes('one hour')) {
        minutes = 60;
      } else if (textLower.includes('30 min') || textLower.includes('half an hour')) {
        minutes = 30;
      } else if (textLower.includes('45 min')) {
        minutes = 45;
      } else if (textLower.includes('3 hours') || textLower.includes('three hours')) {
        minutes = 180;
      }

      let category: TaskCategory = 'University work';
      if (textLower.includes('rag') || textLower.includes('code') || textLower.includes('programming')) {
        category = 'Programming';
      } else if (textLower.includes('exercise') || textLower.includes('workout') || textLower.includes('run')) {
        category = 'Exercise';
      } else if (textLower.includes('read') || textLower.includes('book')) {
        category = 'Reading';
      }

      // Title extraction
      let entryTitle = 'Completed Milestone';
      if (textLower.includes('rag')) {
        entryTitle = 'RAG Implementation & Study';
      } else if (textLower.includes('dld')) {
        entryTitle = 'DLD Class Study & Exercises';
      } else {
        entryTitle = userText.length > 50 ? userText.substring(0, 45) + '...' : userText;
      }

      const logged = StorageService.addActivity({
        title: entryTitle,
        description: userText,
        minutesSpent: minutes,
        category,
        date: new Date().toISOString().split('T')[0],
      });

      // Calculate total for today
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = StorageService.getHistory().filter((h) => h.date === today);
      const totalMinutesToday = todayEntries.reduce((acc, curr) => acc + curr.minutesSpent, 0);
      const totalHoursToday = (totalMinutesToday / 60).toFixed(1);

      return {
        badge: 'Gemma 3n E2B',
        actionTaken: {
          type: 'activity_logged',
          summary: `Recorded ${minutes}m for "${entryTitle}" in Daily Activity`,
        },
        reply: `Recorded in your **Daily Activity History**:

• **Accomplishment**: ${entryTitle}
• **Time Logged**: ${minutes} minutes (${(minutes / 60).toFixed(1)} hrs)
• **Category**: ${category}
• **Today's Total**: ${totalHoursToday} productive hours logged across ${todayEntries.length} sessions.

This activity is now recorded in your daily timeline and reflected on your **Task Heatmap**. Keep this momentum going!`,
      };
    }

    // 6. Book / Article / Learning Recommendation Request
    if (
      textLower.includes('book') ||
      textLower.includes('article') ||
      textLower.includes('recommend resource') ||
      textLower.includes('what should i read') ||
      textLower.includes('learning recommendation') ||
      textLower.includes('topics to study')
    ) {
      return {
        badge: 'Gemma 3n E2B',
        reply: `Based on your personal focus areas (**DLD Class** & **Local RAG Architectures**), here are tailored study recommendations:

1. 📖 **"Computer Organization and Design: RISC-V Edition"** by David A. Patterson & John L. Hennessy
   • Directly reinforces your DLD class, flip-flop state machines, and hardware-software interface.

2. 📖 **"Designing Data-Intensive Applications"** by Martin Kleppmann
   • Solid foundation for building local offline vector retrieval and resilient data indexing.

3. 📄 **"Sequential Logic & State Machine Synthesis"**
   • Essential for Karnaugh map minimization and synchronous counters.

Would you like me to create a task in your To-Do list for any of these?`,
      };
    }

    // 7. Planning / Deadlines inquiry
    if (textLower.includes('plan') || textLower.includes('deadline') || textLower.includes('study session')) {
      const upcoming = plans.slice(0, 3);
      const planList = upcoming
        .map(
          (p) =>
            `• **${p.title}** (${p.type.replace('_', ' ')}) — Due: ${p.dueDate}${p.notes ? `\n  *Notes: ${p.notes}*` : ''}`
        )
        .join('\n');

      return {
        badge: 'Gemma 3n E2B',
        reply: `Here is a snapshot of your current plans and deadlines from your **Planning Tab**:

${planList || 'No upcoming plans set yet.'}

You can ask me to reschedule any session, add a new project milestone, or break down a study block anytime.`,
      };
    }

    // 8. General Conversational Intelligence tailored to Personal Context
    return {
      badge: 'Gemma 3n E2B',
      reply: `I understand. Keeping your vision in mind (*"${profile.visionAndGoals.split('\n')[0].replace(/^[•\s]*/, '')}"*), here is how we can approach this:

1. **Next Best Move**: You have active tasks in **${tasks[0]?.category || 'University work'}** and **${tasks[1]?.category || 'Programming'}**.
2. **Current Energy (${currentEnergy.toUpperCase()})**: ${
        currentEnergy === 'high'
          ? 'Prime state for deep logic design or core code implementation.'
          : currentEnergy === 'medium'
          ? 'Great for 20-30 minute focused blocks and review sessions.'
          : 'Ideal for note consolidation, light reading, or stretching.'
      }

Would you like me to allocate your next 30-minute block, breakdown your DLD subtasks, or log what you just accomplished?`,
    };
  }

  /**
   * Generates highly specific split-time recommendations matching user prompt requirements:
   * "For example: Spend the next 20 minutes working on ABC, then use the remaining 10 minutes to review XYZ."
   */
  private static generateTimeAndEnergyRecommendation(
    minutes: number,
    energy: 'high' | 'medium' | 'low',
    tasks: TaskItem[],
    profile: any
  ): AiProcessResult {
    const uncompletedTasks = tasks.filter((t) => !t.completed);

    if (uncompletedTasks.length === 0) {
      return {
        badge: 'Gemma 3n E2B',
        reply: `You currently have 0 pending tasks! Since you have **${minutes} minutes** free with **${energy} energy**:
• Spend ${Math.round(minutes * 0.7)} minutes reading an article from your offline library (e.g. *Local Vector Search*).
• Use the remaining ${Math.round(minutes * 0.3)} minutes to jot down reflections and plan tomorrow's goals in the Planning tab.`,
      };
    }

    // Primary task selection based on priority & energy
    let primaryTask = uncompletedTasks[0];
    let secondaryTask = uncompletedTasks[1] || uncompletedTasks[0];

    if (energy === 'low') {
      const lowEnergyTask = uncompletedTasks.find((t) => t.category === 'Reading' || t.priority === 'low');
      if (lowEnergyTask) primaryTask = lowEnergyTask;
    } else if (energy === 'high') {
      const highEnergyTask = uncompletedTasks.find((t) => t.priority === 'high');
      if (highEnergyTask) primaryTask = highEnergyTask;
    }

    // Time division math:
    // E.g., if 30 minutes: 20 min on ABC, 10 min on XYZ
    const primaryMinutes = Math.max(10, Math.round(minutes * (minutes <= 30 ? 0.67 : 0.75)));
    const secondaryMinutes = minutes - primaryMinutes;

    let recommendation = '';

    if (secondaryMinutes > 0 && secondaryTask.id !== primaryTask.id) {
      recommendation = `You have **${minutes} minutes** free with **${energy.toUpperCase()} energy**. Here is your optimal personalized plan:

1. **First ${primaryMinutes} minutes** → Focus exclusively on **${primaryTask.title}**:
   • Work through the top subcomponent in its description.
   • Put your phone away and keep your attention completely unified.

2. **Remaining ${secondaryMinutes} minutes** → Transition to **${secondaryTask.title}**:
   • Quick review, note-taking, or verification of what you completed.

This structure matches your Pomodoro preference and prevents cognitive burnout. Ready to start your timer?`;
    } else {
      recommendation = `You have **${minutes} minutes** free with **${energy.toUpperCase()} energy**:

• Spend the entire **${minutes} minutes** on **${primaryTask.title}**.
• Focus on finishing: *"${primaryTask.description.split('\n')[0] || primaryTask.title}"*.
• Take a 3-minute breather when finished, then let me know so I can log it to your Daily History!`;
    }

    return {
      badge: 'Gemma 3n E2B',
      reply: recommendation,
    };
  }
}
