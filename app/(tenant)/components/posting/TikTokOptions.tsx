'use client';

type TikTokOptionsProps = {
  disableDuet: boolean;
  disableStitch: boolean;
  disableComment: boolean;
  scheduleTime: string | null;
  onDisableDuetChange: (value: boolean) => void;
  onDisableStitchChange: (value: boolean) => void;
  onDisableCommentChange: (value: boolean) => void;
  onScheduleTimeChange: (value: string | null) => void;
};

export default function TikTokOptions({
  disableDuet,
  disableStitch,
  disableComment,
  scheduleTime,
  onDisableDuetChange,
  onDisableStitchChange,
  onDisableCommentChange,
  onScheduleTimeChange,
}: TikTokOptionsProps) {
  const localDateTimeString = scheduleTime
    ? new Date(new Date(scheduleTime).getTime() - new Date(scheduleTime).getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : '';

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localValue = e.target.value;
    if (!localValue) {
      onScheduleTimeChange(null);
      return;
    }
    const local = new Date(localValue);
    const iso = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
    onScheduleTimeChange(iso);
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-gray-900">TikTok Posting Options</h3>
      
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={disableDuet}
            onChange={(e) => onDisableDuetChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Disable Duet</span>
            <p className="text-xs text-gray-500">Prevent users from creating duets with this video</p>
          </div>
        </label>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={disableStitch}
            onChange={(e) => onDisableStitchChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Disable Stitch</span>
            <p className="text-xs text-gray-500">Prevent users from stitching this video</p>
          </div>
        </label>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={disableComment}
            onChange={(e) => onDisableCommentChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Disable Comments</span>
            <p className="text-xs text-gray-500">Turn off comments on this video</p>
          </div>
        </label>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold text-gray-700">Schedule Time (Optional)</label>
        <input
          type="datetime-local"
          value={localDateTimeString}
          onChange={handleDateTimeChange}
          min={new Date().toISOString().slice(0, 16)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-xs text-gray-500">
          Leave empty to use the main schedule time. TikTok-specific scheduling.
        </p>
      </div>
    </div>
  );
}

