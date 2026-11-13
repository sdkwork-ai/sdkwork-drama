import { useState, type FormEvent } from 'react';

import { copy } from '../i18n';
import type { EpisodeDraftInput } from '../services/episode-service';
import type { NormalizedProblem } from '../services/problem';
import { NavBar } from './NavBar';

export function CreateScreen({
  busy,
  error,
  onBack,
  onSubmit,
}: {
  readonly busy: boolean;
  readonly error: NormalizedProblem | null;
  readonly onBack: () => void;
  readonly onSubmit: (draft: EpisodeDraftInput) => void;
}) {
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
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
    <div className="screen">
      <NavBar title={copy.editor.createTitle} onBack={onBack} />
      <form className="surface field-stack" onSubmit={submit}>
        <label className="field">
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
        <label className="field">
          <span>{copy.editor.synopsisLabel}</span>
          <textarea
            value={synopsis}
            onChange={(event) => setSynopsis(event.target.value)}
            placeholder={copy.editor.synopsisPlaceholder}
            rows={6}
            maxLength={2000}
            disabled={busy}
          />
        </label>
        {validation ? <p className="form-error" role="alert">{validation}</p> : null}
        {error ? <p className="form-error" role="alert">{error.detail}</p> : null}
        <button type="submit" className="btn" data-tone="primary" disabled={busy}>
          {busy ? copy.editor.creating : copy.editor.create}
        </button>
      </form>
    </div>
  );
}
