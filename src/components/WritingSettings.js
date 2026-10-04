import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, Target } from 'lucide-react';
import {
  backgroundChecksSupported,
  getReminder,
  notificationsSupported,
  sendTestReminder,
  setReminder,
} from '../lib/reminders';
import { useAuth } from '../context/AuthContext';

const GOALS = [0, 100, 250, 500, 750];

/** Settings cards for the daily word goal and the writing reminder. */
export default function WritingSettings() {
  const { user, updateProfile } = useAuth();
  const goal = Number(user?.user_metadata?.word_goal ?? 250);
  const [reminder, setReminderState] = useState(getReminder);
  const [background, setBackground] = useState(null);
  const [busy, setBusy] = useState(false);
  const supported = notificationsSupported();

  useEffect(() => {
    backgroundChecksSupported().then(setBackground);
  }, []);

  const changeGoal = async (word_goal) => {
    try {
      await updateProfile({ data: { word_goal } });
      toast.success(word_goal ? `Daily goal: ${word_goal} words` : 'Word goal turned off', { id: 'goal' });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const update = async (changes) => {
    setBusy(true);
    try {
      setReminderState(await setReminder(changes));
      if (changes.enabled) toast.success(`Reminder set for ${changes.time ?? reminder.time}`, { id: 'reminder' });
    } catch (err) {
      toast.error(err.message);
    }
    setBusy(false);
  };

  return (
    <>
      <section className="settings-card">
        <h2 className="settings-heading">
          <Target size={18} /> Daily word goal
        </h2>
        <div className="segmented segmented-wrap" role="radiogroup" aria-label="Daily word goal">
          {GOALS.map((g) => (
            <button
              type="button"
              key={g}
              role="radio"
              aria-checked={goal === g}
              className={`segmented-option${goal === g ? ' is-selected' : ''}`}
              onClick={() => changeGoal(g)}
            >
              {g ? g : 'Off'}
            </button>
          ))}
        </div>
        <p className="settings-help">A progress bar under each entry fills up as you write. Saved to your account.</p>
      </section>

      <section className="settings-card">
        <h2 className="settings-heading">
          <Bell size={18} /> Daily reminder
        </h2>
        {!supported ? (
          <p className="settings-help">
            This browser can’t show notifications. Install Vrinzu on your phone to get reminders.
          </p>
        ) : (
          <>
            <label className="toggle-row">
              <span className="toggle-text">
                <span className="toggle-title">Remind me to write</span>
                <span className="toggle-help">A gentle nudge at a time you choose.</span>
              </span>
              <input
                type="checkbox"
                className="toggle"
                checked={reminder.enabled}
                disabled={busy}
                onChange={(e) => update({ enabled: e.target.checked })}
              />
            </label>
            {reminder.enabled && (
              <div className="reminder-row">
                <label className="field-label" htmlFor="reminder-time">
                  Time
                </label>
                <input
                  id="reminder-time"
                  type="time"
                  className="input reminder-time"
                  value={reminder.time}
                  disabled={busy}
                  onChange={(e) => e.target.value && update({ time: e.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => sendTestReminder().catch((err) => toast.error(err.message))}
                >
                  Test
                </button>
              </div>
            )}
            <p className="settings-help">
              Skipped on days you’ve already written.
              {background === false &&
                ' This browser can’t wake Vrinzu in the background, so reminders arrive only on Android with Vrinzu installed.'}
            </p>
          </>
        )}
      </section>
    </>
  );
}
