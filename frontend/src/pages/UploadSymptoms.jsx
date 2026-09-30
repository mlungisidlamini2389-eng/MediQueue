import { useEffect, useState } from "react";
import { UploadCloud, Camera, X, ArrowRight } from "lucide-react";
import ProgressBar from "../components/ProgressBar";
import QuestionCard from "../components/QuestionCard";
import Button from "../components/Button";
function Photo({ file, onRemove }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const value = URL.createObjectURL(file);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [file]);
  return (
    <div className="photo">
      <img src={url} alt={`Selected attachment: ${file.name}`} />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
      >
        <X size={16} />
      </button>
      <small>{file.name}</small>
    </div>
  );
}
export default function UploadSymptoms({ draft, setDraft, demo }) {
  const [error, setError] = useState("");
  function addPhotos(event) {
    const files = Array.from(event.target.files);
    event.target.value = "";
    if (
      files.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 5 * 1024 * 1024,
      )
    )
      return setError("Choose JPG, PNG or WebP images smaller than 5 MB each.");
    if (draft.photos.length + files.length > 3)
      return setError(
        "You can add up to 3 photos. Remove one before adding another.",
      );
    setError("");
    setDraft((old) => ({ ...old, photos: [...old.photos, ...files] }));
  }
  return (
    <main className="flow-container">
      <h1>Anything else on your mind?</h1>
      <p className="page-intro">Your own words can help tell the full story.</p>
      <ProgressBar step={3} />
      <QuestionCard
        title="Add a little more detail"
        description="This step is optional."
      >
        <label className="field-label">
          Additional symptoms or concerns
          <textarea
            rows={5}
            maxLength={3000}
            placeholder="What would you like your care team to know?"
            value={draft.notes}
            onChange={(e) =>
              setDraft((old) => ({ ...old, notes: e.target.value }))
            }
          />
        </label>
        <small className="character-count">{draft.notes.length}/3000</small>
        <div className="upload-options">
          <label className="upload-zone">
            <UploadCloud size={30} />
            <strong>Choose photos</strong>
            <span>JPG, PNG or WebP · up to 5 MB each</span>
            <input
              aria-label="Choose photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={addPhotos}
            />
          </label>
          <label className="upload-zone">
            <Camera size={30} />
            <strong>Take a photo</strong>
            <span>Photograph a visible concern with your camera</span>
            <input
              aria-label="Take a photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={addPhotos}
            />
          </label>
        </div>
        <p className="muted small">
          {demo
            ? "Demo attachments stay in this tab and are not uploaded. Please use sample images."
            : "Signed-in attachments are stored by this local prototype for administrator review. Please use sample images."}
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="photo-grid">
          {draft.photos.map((file, index) => (
            <Photo
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() =>
                setDraft((old) => ({
                  ...old,
                  photos: old.photos.filter((_, i) => i !== index),
                }))
              }
            />
          ))}
        </div>
      </QuestionCard>
      <div className="flow-actions">
        <Button variant="outline" href="#/consultation">
          Back
        </Button>
        <Button href="#/review">
          Review information <ArrowRight size={16} />
        </Button>
      </div>
    </main>
  );
}
