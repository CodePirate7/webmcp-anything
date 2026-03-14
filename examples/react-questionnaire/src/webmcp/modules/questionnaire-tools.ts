/**
 * Questionnaire Page Tools — mounted in QuestionnaireEditPage.
 *
 * These tools are available only when the user is on /questionnaire/edit/:id.
 * They register on page mount and unregister on page unmount.
 *
 * This is a simplified example. See useQuestionnaireTools.ts in the real
 * project for the full 688-line implementation.
 */

import { useWebMCP, textResult, jsonResult } from '@webmcp-anything/sdk';
import { useDispatch } from 'react-redux';
import { store } from '@/store';
import type { Dispatch, RootState } from '@/store';

// ──────────── Schemas ────────────

const EMPTY_SCHEMA = { type: 'object', properties: {} } as const;

const BATCH_CREATE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: '问卷标题' },
    questions: {
      type: 'array',
      description: '题目列表',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['radio', 'checkbox', 'input', 'rate', 'desc', 'date'],
            description: '题型: radio=单选, checkbox=多选, input=填空, rate=评分, desc=文本说明, date=日期',
          },
          title: { type: 'string', description: '题目标题（无需带题号）' },
          options: {
            type: 'array',
            items: { type: 'string' },
            description: '选项文本列表（仅 radio/checkbox 需要）',
          },
          required: { type: 'boolean', description: '是否必填，默认 true' },
        },
        required: ['type', 'title'],
      },
    },
  },
  required: ['title', 'questions'],
} as const;

const MODIFY_SCHEMA = {
  type: 'object',
  properties: {
    questionIndex: { type: 'number', description: '要修改的题目序号（1-based）' },
    title: { type: 'string', description: '新的题目标题（不传则不修改）' },
    required: { type: 'boolean', description: '是否必填（不传则不修改）' },
    options: {
      type: 'array',
      items: { type: 'string' },
      description: '替换全部选项（仅 radio/checkbox，不传则不修改）',
    },
  },
  required: ['questionIndex'],
} as const;

const DELETE_SCHEMA = {
  type: 'object',
  properties: {
    questionIndexes: {
      type: 'array',
      items: { type: 'number' },
      description: '要删除的题目序号列表（1-based）',
    },
  },
  required: ['questionIndexes'],
} as const;

// ──────────── Helpers ────────────

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getQuestionState() {
  return (store.getState() as RootState).question;
}

// ──────────── Hook ────────────

/**
 * Questionnaire editing WebMCP Tools.
 *
 * Mount this hook in the QuestionnaireEditPage component:
 *
 *   function QuestionnaireEditPage() {
 *     useQuestionnaireTools();
 *     return <QuestionnaireEditor />;
 *   }
 */
export function useQuestionnaireTools() {
  const dispatch = useDispatch<Dispatch>();

  // ── read_questionnaire_state ──
  useWebMCP({
    name: 'read_questionnaire_state',
    description: '读取当前正在编辑的问卷状态（标题、所有题目、选项、逻辑关系等）',
    inputSchema: EMPTY_SCHEMA,
    annotations: { readOnlyHint: true },
    execute: async () => {
      const { title, blocks, metaData, optionData, saving } = getQuestionState();

      const questions = blocks.map((block: any, index: number) => {
        const meta = metaData[block.id];
        const opts = (meta?.options || []).map((optId: string) => ({
          label: optionData[optId]?.label || '',
        }));

        return {
          index: index + 1,
          type: block.type,
          title: meta?.title || '',
          required: meta?.required ?? true,
          options: opts.length > 0 ? opts : undefined,
        };
      });

      return jsonResult({ title, questionCount: blocks.length, saving, questions });
    },
  });

  // ── batch_create_questionnaire ──
  useWebMCP({
    name: 'batch_create_questionnaire',
    description: '一次性创建完整问卷：设置标题并批量添加所有题目和选项。会清除当前已有的题目。',
    inputSchema: BATCH_CREATE_SCHEMA,
    execute: async (args) => {
      try {
        const { title, questions } = args;
        if (!title || !questions?.length) {
          return textResult('参数错误: title 和 questions 不能为空');
        }

        // Clear existing blocks
        const currentBlocks = getQuestionState().blocks;
        for (let i = currentBlocks.length - 1; i >= 0; i--) {
          dispatch.question.deleteBlock(i);
        }

        // Set title
        dispatch.question.updateTitle(title);

        // Add questions (simplified — real impl has createBlock helper)
        for (const q of questions) {
          dispatch.question.addBlock({ type: q.type, mode: '', position: -1 });
          await delay(50);
          // ... set title, options, required (see real implementation)
        }

        await delay(100);
        dispatch.question.setQuestionnaire(); // trigger save

        return jsonResult({ success: true, title, questionsCreated: questions.length });
      } catch (e: any) {
        return textResult(`创建问卷失败: ${e.message}`);
      }
    },
  });

  // ── modify_question ──
  useWebMCP({
    name: 'modify_question',
    description: '修改问卷中某一题的标题、选项、必填属性。通过 questionIndex（1-based）指定。',
    inputSchema: MODIFY_SCHEMA,
    execute: async (args) => {
      try {
        const { questionIndex } = args;
        const idx = questionIndex - 1;
        const state = getQuestionState();

        if (idx < 0 || idx >= state.blocks.length) {
          return textResult(`题目序号 ${questionIndex} 不存在，当前共 ${state.blocks.length} 题`);
        }

        // Apply modifications using existing store actions
        // ... (simplified — see real implementation for full logic)

        await delay(100);
        dispatch.question.setQuestionnaire();

        return jsonResult({ success: true, modified: { index: questionIndex } });
      } catch (e: any) {
        return textResult(`修改题目失败: ${e.message}`);
      }
    },
  });

  // ── delete_questions ──
  useWebMCP({
    name: 'delete_questions',
    description: '删除问卷中指定的题目。通过 questionIndexes（1-based 数组）指定。',
    inputSchema: DELETE_SCHEMA,
    execute: async (args) => {
      try {
        const { questionIndexes } = args;
        // Sort descending to avoid index shifting
        const sorted = [...questionIndexes].sort((a, b) => b - a);

        for (const qIdx of sorted) {
          const idx = qIdx - 1;
          const state = getQuestionState();
          if (idx >= 0 && idx < state.blocks.length) {
            dispatch.question.deleteBlock(idx);
          }
        }

        await delay(100);
        dispatch.question.setQuestionnaire();

        return jsonResult({
          success: true,
          deleted: questionIndexes,
          remaining: getQuestionState().blocks.length,
        });
      } catch (e: any) {
        return textResult(`删除题目失败: ${e.message}`);
      }
    },
  });
}
