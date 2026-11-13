import { useState, type FormEvent } from 'react';

import { copy } from '../i18n';
import type { EpisodeDraftInput } from '../services/episode-service';
import type { NormalizedProblem } from '../services/problem';

export function EpisodeForm({
  mode,
  initial,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  readonly mode: 'create' | 'edit';
  readonly initial: EpisodeDraftInput;
  readonly busy: boolean;
  readonly error: NormalizedProblem | null;
  readonly onSubmit: (draft: EpisodeDraftInput) => void;
  readonly onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [synopsis, setSynopsis] = useState(initial.synopsis);
  const [validation, setValidation] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (title.trim().length === 0) {
      setValidation(copy.editor.validationTitle);
      return;
    }
    setValidation('');
    onSubmit({ title, synopsis });
  };

  return (
    <div className="overlay" role="presentation" onClick={onCancel}>
      <div
        className="dialog dialog-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="episode-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">{mode === 'create' ? copy.editor.createTitle : copy.editor.editTitle}</p>
        <h2 id="episode-form-title">
          {mode === 'create' ? copy.editor.createTitle : copy.editor.title}
        </h2>
        <form className="episode-form" onSubmit={submit}>
          <label>
            <span>{copy.editor.titleLabel}</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={copy.editor.titlePlaceholder}
              maxLength={200}
              autoFocus
              disabled={busy}
              required
            />
          </label>
          <label>
            <span>{copy.editor.synopsisLabel}</span>
            <textarea
              value={synopsis}
              onChange={(event) => setSynopsis(event.target.value)}
              placeholder={copy.editor.synopsisPlaceholder}
              rows={5}
              maxLength={2000}
              disabled={busy}
            />
          </label>
          {validation ? <p className="form-error" role="alert">{validation}</p> : null}
          {error ? <p className="form-error" role="alert">{error.detail}</p> : null}
          <div className="dialog-actions">
            <button type="button" className="button" onClick={onCancel} disabled={busy}>
              {copy.editor.cancel}
            </button>
            <button type="submit" className="button" data-tone="primary" disabled={busy}>
              {busy
                ? mode === 'create'
                  ? copy.editor.creating
                  : copy.editor.saving
                : mode === 'create'
                  ? copy.editor.create
                  : copy.editor.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
