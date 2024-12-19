/* eslint-disable max-len */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  createTodo,
  deleteTodo,
  getTodos,
  updateTodo,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import { ErrorNotification } from './components/ErrorNotification';
import { FiltersType } from './types/FiltersType';
import { TodoList } from './components/TodoList';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ErrorTypes } from './types/ErrorTypes';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorTodos, setErrorTodos] = useState(ErrorTypes.NoErrors);
  const [status, setStatus] = useState(FiltersType.All);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTodosIds, setLoadingTodosIds] = useState<number[]>([]);

  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const handleErrorClose = useCallback(() => {
    setErrorTodos(ErrorTypes.NoErrors);
  }, []);

  const visibleTodos = todos?.filter(todo => {
    switch (status) {
      case FiltersType.Completed:
        return todo.completed;
      case FiltersType.Active:
        return !todo.completed;
      default:
        return true;
    }
  });

  const activeTodosCount = useMemo(
    () => todos.filter(todo => !todo.completed).length,
    [todos],
  );

  const completedTodos = useMemo(
    () => todos.filter(todo => todo.completed),
    [todos],
  );
  const completedTodosCount = completedTodos.length;

  useEffect(() => {
    setIsLoading(true);
    getTodos()
      .then(data => setTodos(data))
      .catch(() => {
        setErrorTodos(ErrorTypes.Loading);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const onAddTodo = async (newTodo: Omit<Todo, 'id'>): Promise<void> => {
    try {
      const createdTodo = await createTodo(newTodo);

      setTodos(currentTodos => [...currentTodos, createdTodo]);
    } catch (error) {
      setErrorTodos(ErrorTypes.Add);
      throw error;
    }
  };

  const onDeleteTodo = async (todoId: number) => {
    setLoadingTodosIds(currentIds => [...currentIds, todoId]);
    try {
      await deleteTodo(todoId);
      setTodos(currentTodos => currentTodos.filter(todo => todo.id !== todoId));
    } catch (error) {
      setErrorTodos(ErrorTypes.Delete);
      throw error;
    } finally {
      setLoadingTodosIds(currentIds => currentIds.filter(id => id !== todoId));
    }
  };

  const onDeleteAllCompleted = () => {
    completedTodos.forEach(completedTodo => {
      onDeleteTodo(completedTodo.id);
    });
  };

  const onUpdateTodo = async (newTodo: Todo) => {
    setLoadingTodosIds(currentIds => [...currentIds, newTodo.id]);
    try {
      const updatedTodo = await updateTodo(newTodo);

      setTodos(currentTodos =>
        currentTodos.map(todo => {
          return todo.id === updatedTodo.id ? updatedTodo : todo;
        }),
      );
    } catch (error) {
      setErrorTodos(ErrorTypes.Update);
      throw error;
    } finally {
      setLoadingTodosIds(currentIds =>
        currentIds.filter(id => id !== newTodo.id),
      );
    }
  };

  const onUpdateToggleAll = () => {
    todos.forEach(todo => {
      if (todos.length === completedTodos.length) {
        onUpdateTodo({ ...todo, completed: false });

        return;
      }

      if (todo.completed === false) {
        onUpdateTodo({ ...todo, completed: true });

        return;
      }
    });
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          todos={todos}
          completedTodosCount={completedTodosCount}
          onAddTodo={onAddTodo}
          setErrorTodos={setErrorTodos}
          tempTodo={tempTodo}
          setTempTodo={setTempTodo}
          onUpdateToggleAll={onUpdateToggleAll}
        />

        {todos?.length && (
          <>
            <TodoList
              todos={visibleTodos}
              onDeleteTodo={onDeleteTodo}
              onUpdateTodo={onUpdateTodo}
              isDataLoading={isLoading}
              loadingTodosIds={loadingTodosIds}
              tempTodo={tempTodo}
            />

            <Footer
              activeCount={activeTodosCount}
              completedCount={completedTodosCount}
              status={status}
              setStatus={setStatus}
              onDeleteAllCompleted={onDeleteAllCompleted}
            />
          </>
        )}
      </div>

      <ErrorNotification
        error={errorTodos}
        handleErrorClose={handleErrorClose}
      />
    </div>
  );
};
