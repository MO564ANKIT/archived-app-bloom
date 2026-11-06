import { useMemo, useState, type ReactNode } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { BudgetSummary } from '@/components/budget/BudgetSummary';
import { BudgetForm } from '@/components/expenses/BudgetForm';
import { CategoryBreakdown } from '@/components/expenses/CategoryBreakdown';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { Button } from '@/components/kit/Button';
import { EmptyState } from '@/components/kit/EmptyState';
import { Modal } from '@/components/kit/Modal';
import { CATEGORIES, CATEGORY_META, type Category } from '@/lib/categories';
import { monthKeyOf } from '@/lib/dates';
import { sortExpenses, summarizeMonth } from '@/lib/finance';
import { useGame } from '@/state/gameContext';
import type { Expense } from '@/types';
import { cn } from '@/lib/cn';

type EditorState = { mode: 'create' } | { mode: 'edit'; expense: Expense } | null;

export function ExpensesPage() {
  const { state, today, addExpense, updateExpense, deleteExpense, saveBudgets } = useGame();
  const [editor, setEditor] = useState<EditorState>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [filter, setFilter] = useState<Category | 'all'>('all');

  const summary = useMemo(() => summarizeMonth(state, monthKeyOf(today)), [state, today]);
  const sorted = useMemo(() => sortExpenses(state.expenses), [state.expenses]);
  const visible = filter === 'all' ? sorted : sorted.filter((expense) => expense.category === filter);
  const hasSamples = state.expenses.some((expense) => expense.isSample);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neon-400">Expense tracker</p>
          <h1 className="mt-1 text-3xl font-bold text-ink-50 sm:text-4xl">Where did the money go?</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-300">
            Log each expense as it happens. Every entry also gives XP to a matching monster, so tracking pays off.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setBudgetOpen(true)}>
            <Wallet className="h-4 w-4" /> Budgets
          </Button>
          <Button variant="primary" onClick={() => setEditor({ mode: 'create' })}>
            <Plus className="h-4 w-4" /> Add expense
          </Button>
        </div>
      </header>

      {hasSamples && (
        <p className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Entries tagged SAMPLE are demo data. Delete them whenever you like, or use the Data menu to reset.
        </p>
      )}

      <section className="card p-5 sm:p-7">
        <h2 className="mb-5 text-lg font-bold text-ink-50">This month</h2>
        <BudgetSummary summary={summary} />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-5 sm:p-7 lg:col-span-3">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink-50">All expenses</h2>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
              <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
                All
              </FilterChip>
              {CATEGORIES.filter((category) => state.expenses.some((expense) => expense.category === category)).map(
                (category) => (
                  <FilterChip key={category} active={filter === category} onClick={() => setFilter(category)}>
                    {CATEGORY_META[category].label}
                  </FilterChip>
                ),
              )}
            </div>
          </div>

          {sorted.length === 0 ? (
            <EmptyState
              title="No expenses yet"
              description="Log your first purchase and your monsters will start earning XP."
              action={
                <Button variant="primary" onClick={() => setEditor({ mode: 'create' })}>
                  <Plus className="h-4 w-4" /> Log an expense
                </Button>
              }
            />
          ) : visible.length === 0 ? (
            <EmptyState
              title="Nothing in this category"
              description="No expenses match this filter. Try another category or view all."
              action={
                <Button variant="ghost" onClick={() => setFilter('all')}>
                  Show all expenses
                </Button>
              }
            />
          ) : (
            <ExpenseList
              expenses={visible}
              today={today}
              onEdit={(expense) => setEditor({ mode: 'edit', expense })}
              onDelete={setDeleting}
            />
          )}
        </section>

        <section className="card p-5 sm:p-7 lg:col-span-2">
          <h2 className="mb-1 text-lg font-bold text-ink-50">Category breakdown</h2>
          <p className="mb-5 text-xs text-ink-400">This month. Bars show budget use when a category limit is set.</p>
          <CategoryBreakdown summary={summary} />
        </section>
      </div>

      <Modal
        open={editor !== null}
        onClose={() => setEditor(null)}
        title={editor?.mode === 'edit' ? 'Edit expense' : 'Log an expense'}
        description="Amounts are stored exactly, down to the paisa."
      >
        {editor && (
          <ExpenseForm
            key={editor.mode === 'edit' ? editor.expense.id : 'new'}
            initial={editor.mode === 'edit' ? editor.expense : undefined}
            today={today}
            onCancel={() => setEditor(null)}
            onSubmit={(input) => {
              if (editor.mode === 'edit') updateExpense(editor.expense.id, input);
              else addExpense(input);
              setEditor(null);
            }}
          />
        )}
      </Modal>

      <Modal open={budgetOpen} onClose={() => setBudgetOpen(false)} title="Budgets" description="Set limits for this month. Leave any field blank for no limit.">
        <BudgetForm
          state={state}
          onCancel={() => setBudgetOpen(false)}
          onSave={({ monthlyBudgetPaise, categoryBudgetsPaise }) => {
            saveBudgets(monthlyBudgetPaise, categoryBudgetsPaise);
            setBudgetOpen(false);
          }}
        />
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete this expense?" maxWidth="md">
        {deleting && (
          <div className="space-y-5">
            <p className="text-sm text-ink-300">
              "{deleting.description}" will be removed from your totals and category breakdown. XP already earned stays with your monsters.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Keep it
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteExpense(deleting.id);
                  setDeleting(null);
                }}
              >
                Delete expense
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition',
        active ? 'border-volt-400 bg-volt-400/20 text-volt-200' : 'border-white/10 text-ink-300 hover:border-white/25 hover:text-ink-100',
      )}
    >
      {children}
    </button>
  );
}
