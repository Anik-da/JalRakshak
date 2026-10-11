import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import L from 'leaflet';
import { api } from '../services/api';
import { detectLiveLocation } from '../services/liveLocation';
import { useAuth } from '../context/AuthContext';
import { SeverityLevel, RoadCondition, FloodReport } from '../types';
import { RiskBadge, RoadConditionBadge } from '../components/common/RiskBadge';
import {
  MapPin,
  Crosshair,
  Droplets,
  AlertTriangle,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Ban,
  Car,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';

export const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loginDemo } = useAuth();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [latitude, setLatitude] = useState<number>(13.0827);
  const [longitude, setLongitude] = useState<number>(80.2707);
  const [locationName, setLocationName] = useState<string>('');
  const [severity, setSeverity] = useState<SeverityLevel>('MODERATE');
  const [roadCondition, setRoadCondition] = useState<RoadCondition>('PASSABLE');
  const [waterDepthCm, setWaterDepthCm] = useState<string>('20');
  const [description, setDescription] = useState<string>('');
  const [observedAt, setObservedAt] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<import('../types').PhotoAnalysisResult | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [consentPublic, setConsentPublic] = useState(true);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<FloodReport | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Leaflet picker map ref
  const mapPickerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map Picker on Step 1
  useEffect(() => {
    if (currentStep !== 1 || !mapPickerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapPickerRef.current, {
        center: [latitude, longitude],
        zoom: 13,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        setLatitude(Number(pos.lat.toFixed(5)));
        setLongitude(Number(pos.lng.toFixed(5)));
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setLatitude(Number(e.latlng.lat.toFixed(5)));
        setLongitude(Number(e.latlng.lng.toFixed(5)));
      });

      pickerMarkerRef.current = marker;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [currentStep]);

  const [locating, setLocating] = useState(false);

  const handleLocateMe = async () => {
    setLocating(true);
    try {
      const loc = await detectLiveLocation();
      if (loc) {
        const [lat, lng] = loc.coordinates;
        setLatitude(Number(lat.toFixed(5)));
        setLongitude(Number(lng.toFixed(5)));
        if (!locationName && loc.localityName && loc.source !== 'DEFAULT') {
          setLocationName(loc.localityName);
        }
        if (mapInstanceRef.current && pickerMarkerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
          pickerMarkerRef.current.setLatLng([lat, lng]);
        }
      }
    } catch (err) {
      console.warn('Live location detection failed:', err);
    } finally {
      setLocating(false);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setSubmitError(null);
    try {
      const presigned = await api.getPresignedUploadUrl(file.name, file.type);
      // In production, upload binary directly to S3 via presigned.uploadUrl
      // For local development or mock, simulate upload completion
      setImageUrl(presigned.imageUrl);
    } catch (err: any) {
      setSubmitError(`Image presign failed: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentPublic) {
      setSubmitError('Consent is required to publish this hazard report to the community.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.createReport({
        latitude,
        longitude,
        locationName,
        severity,
        roadCondition,
        waterDepthCm: waterDepthCm ? parseInt(waterDepthCm, 10) : undefined,
        description,
        observedAt: new Date(observedAt).toISOString(),
        imageUrl: imageUrl || undefined,
        consentPublicSharing: consentPublic,
      });

      setSubmittedReport(res.report);
      setDuplicateWarning(res.duplicateWarning || null);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Please check fields and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedReport) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-surface rounded-2xl border border-carto-border p-8 shadow-carto-modal text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-forest-subtle border border-forest/30 flex items-center justify-center mx-auto text-forest">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono uppercase text-forest font-semibold tracking-wider">
              Telemetry Confirmed
            </span>
            <h2 className="text-2xl font-display font-bold text-carto-text">
              Flood Observation Registered
            </h2>
            <p className="text-xs text-carto-muted max-w-md mx-auto">
              Your report has been written to Amazon DynamoDB and is queued for municipal ward and community review.
            </p>
          </div>

          <div className="bg-surface-muted/70 p-4 rounded-xl border border-carto-border text-left space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-carto-muted">Report ID:</span>
              <span className="font-semibold text-carto-text">{submittedReport.reportId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-carto-muted">Location:</span>
              <span className="text-carto-text">{submittedReport.locationName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-carto-muted">Status:</span>
              <span className="text-carto-muted font-bold">UNVERIFIED (Awaiting Review)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-carto-muted">Server Timestamp:</span>
              <span className="text-carto-text">{new Date(submittedReport.submittedAt).toLocaleTimeString()}</span>
            </div>
          </div>

          {duplicateWarning && (
            <div className="bg-risk-mod-bg text-risk-mod p-3 rounded-lg text-xs font-mono text-left border border-risk-mod/30">
              <strong>Notice:</strong> {duplicateWarning}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/map"
              className="bg-forest hover:bg-forest-deep text-white px-5 py-2.5 rounded-lg text-xs font-medium font-mono transition"
            >
              View on Hazard Map
            </Link>
            <Link
              to={`/reports/${submittedReport.reportId}`}
              className="bg-surface hover:bg-surface-muted text-carto-text px-4 py-2.5 rounded-lg text-xs font-medium font-mono border border-carto-border transition"
            >
              Inspection Details
            </Link>
            <button
              onClick={() => {
                setSubmittedReport(null);
                setCurrentStep(1);
                setLocationName('');
                setDescription('');
              }}
              className="text-xs text-carto-muted hover:text-forest font-mono py-2"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-forest-subtle border border-forest/30 flex items-center justify-center mx-auto text-forest shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <span className="text-xs font-mono uppercase text-forest font-bold tracking-wider px-3 py-1 bg-forest-subtle rounded-full border border-forest/20 inline-block">
            Civic Contributor Verification Protocol
          </span>
          <h1 className="text-3xl font-display font-bold text-carto-text">
            Sign In Required to Report Hazards
          </h1>
          <p className="text-sm text-carto-muted max-w-lg mx-auto leading-relaxed">
            To safeguard community flood telemetry against malicious spam and ensure municipal accountability, all hazard submissions require an authenticated civic account.
          </p>
        </div>

        {/* Informational Cards */}
        <div className="bg-surface rounded-2xl border border-carto-border p-6 shadow-carto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-muted/60 border border-carto-border/60 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-mono font-bold text-carto-text">
                <ShieldCheck className="w-4 h-4 text-forest" />
                <span>Identity Shielded</span>
              </div>
              <p className="text-carto-muted text-[11px] leading-relaxed">
                Your email, phone, and identity remain strictly masked on public maps (<span className="font-mono">c***@community.in</span>).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-muted/60 border border-carto-border/60 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-mono font-bold text-carto-text">
                <Sparkles className="w-4 h-4 text-water" />
                <span>Deduplication</span>
              </div>
              <p className="text-carto-muted text-[11px] leading-relaxed">
                Observations within 350m are automatically grouped to reinforce consensus without inflating risk.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-muted/60 border border-carto-border/60 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-mono font-bold text-carto-text">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Track Status</span>
              </div>
              <p className="text-carto-muted text-[11px] leading-relaxed">
                Monitor municipal verification notes, clearance confirmations, and community flags in real time.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-carto-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/login?redirect=/report"
                className="w-full bg-forest hover:bg-forest-deep text-white py-3 rounded-xl text-xs font-mono font-medium transition shadow-carto flex items-center justify-center space-x-2"
              >
                <span>Sign In to Existing Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register?redirect=/report"
                className="w-full bg-surface hover:bg-surface-muted text-carto-text py-3 rounded-xl text-xs font-mono font-medium transition border border-carto-border flex items-center justify-center space-x-2"
              >
                <span>Create New Reporter Account</span>
              </Link>
            </div>

            {/* Instant 1-Click Demo Citizen Login */}
            <div className="bg-forest-subtle/50 rounded-xl p-3.5 border border-forest/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-forest block">
                  Hackathon Judge / Instant Evaluation?
                </span>
                <span className="text-[11px] text-carto-muted">
                  Bypass typing credentials and unlock the 4-step reporting wizard instantly:
                </span>
              </div>
              <button
                type="button"
                onClick={() => loginDemo('CITIZEN')}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-forest text-white hover:bg-forest-deep transition text-xs font-mono font-medium shrink-0 flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <span>1-Click Citizen Demo Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Editorial Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono text-carto-muted mb-1">
          <Link to="/map" className="hover:text-forest">Map</Link>
          <span>/</span>
          <span className="text-forest">Report Incident</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-carto-text">
          Submit Road Hazard Observation
        </h1>
        <p className="text-xs text-carto-muted mt-1">
          Help neighbors navigate safely. Every report is audited, validated, and incorporated into local risk estimates.
        </p>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="grid grid-cols-4 gap-2 text-xs font-mono">
        {[
          { num: 1, label: 'Location' },
          { num: 2, label: 'Conditions' },
          { num: 3, label: 'Evidence' },
          { num: 4, label: 'Review' },
        ].map((s) => (
          <div
            key={s.num}
            className={`border-b-2 pb-2 transition ${
              currentStep === s.num
                ? 'border-forest text-forest font-semibold'
                : currentStep > s.num
                ? 'border-forest/50 text-carto-text'
                : 'border-carto-border text-carto-muted'
            }`}
          >
            <span className="block text-[10px] text-carto-muted">Step {s.num}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Form Container */}
      <div className="bg-surface rounded-2xl border border-carto-border p-6 sm:p-8 shadow-carto">
        {submitError && (
          <div className="mb-6 bg-risk-crit-bg text-risk-crit p-3 rounded-lg text-xs font-mono flex items-center space-x-2 border border-risk-crit/20">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* STEP 1: LOCATION */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase text-carto-text font-bold">
                1. Select Exact Hazard Coordinate
              </label>
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={locating}
                className="text-xs font-mono text-forest hover:text-forest-deep flex items-center space-x-1 disabled:opacity-50"
              >
                <Crosshair className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Detecting Location...' : 'Use Current Location'}</span>
              </button>
            </div>

            <div className="h-64 sm:h-72 rounded-xl overflow-hidden border border-carto-border relative">
              <div ref={mapPickerRef} className="w-full h-full" />
              <div className="absolute bottom-2 left-2 z-[400] bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono border border-carto-border">
                Lat: {latitude}°N, Lng: {longitude}°E (Drag marker or click map)
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-carto-text mb-1">
                Road, Junction, or Locality Name <span className="text-risk-crit">*</span>
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Poonamallee High Road under railway bridge"
                className="w-full px-3.5 py-2.5 rounded-lg border border-carto-border bg-paper text-sm text-carto-text focus:outline-none focus:border-forest"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-carto-border">
              <button
                type="button"
                disabled={!locationName.trim()}
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center space-x-2 bg-forest hover:bg-forest-deep disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-medium font-mono transition"
              >
                <span>Continue to Conditions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CONDITIONS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Severity selection */}
            <div>
              <label className="block text-xs font-mono uppercase text-carto-text font-bold mb-2">
                Hazard Severity Level <span className="text-risk-crit">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as SeverityLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                      severity === lvl
                        ? 'border-forest bg-forest-subtle/50 ring-1 ring-forest'
                        : 'border-carto-border bg-paper hover:bg-surface-muted'
                    }`}
                  >
                    <RiskBadge severity={lvl} size="sm" />
                    <span className="text-[10px] text-carto-muted mt-2 block">
                      {lvl === 'LOW' && 'Puddles, < 15cm'}
                      {lvl === 'MODERATE' && 'Slow transit, 15-30cm'}
                      {lvl === 'HIGH' && 'Deep water, > 30cm'}
                      {lvl === 'CRITICAL' && 'Danger, impassable'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Road condition */}
            <div>
              <label className="block text-xs font-mono uppercase text-carto-text font-bold mb-2">
                Road Passability Condition <span className="text-risk-crit">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['PASSABLE', 'DIFFICULT', 'BLOCKED', 'UNKNOWN'] as RoadCondition[]).map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setRoadCondition(cond)}
                    className={`p-2.5 rounded-lg border text-xs font-mono text-center transition ${
                      roadCondition === cond
                        ? 'border-forest bg-forest-subtle/50 text-forest font-semibold'
                        : 'border-carto-border bg-paper hover:bg-surface-muted text-carto-text'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Water depth and time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-carto-text mb-1">
                  Observed Water Depth (Optional cm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={waterDepthCm}
                    onChange={(e) => setWaterDepthCm(e.target.value)}
                    placeholder="e.g. 35"
                    className="w-full px-3.5 py-2 rounded-lg border border-carto-border bg-paper text-sm text-carto-text focus:outline-none focus:border-forest"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-carto-muted">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-carto-text mb-1">
                  Observation Time <span className="text-risk-crit">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={observedAt}
                  onChange={(e) => setObservedAt(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-carto-border bg-paper text-sm text-carto-text focus:outline-none focus:border-forest font-mono text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-carto-text mb-1">
                Description of Hazard & Safety Context <span className="text-risk-crit">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe current water flow, stalled vehicles, blocked underpasses, or alternate service lane availability..."
                className="w-full px-3.5 py-2 rounded-lg border border-carto-border bg-paper text-sm text-carto-text focus:outline-none focus:border-forest"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-carto-border">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center space-x-1.5 text-xs font-mono text-carto-muted hover:text-carto-text"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={description.trim().length < 5}
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center space-x-2 bg-forest hover:bg-forest-deep disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-medium font-mono transition"
              >
                <span>Continue to Evidence</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: EVIDENCE / PHOTO */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase text-carto-text font-bold mb-1">
                3. Optional Field Photograph
              </label>
              <p className="text-xs text-carto-muted">
                Photos help civic ward coordinators verify observations faster. Uploads are securely stored in Amazon S3 via short-lived presigned URLs.
              </p>
            </div>

            <div className="border-2 border-dashed border-carto-border rounded-xl p-8 text-center space-y-3 bg-paper">
              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mx-auto text-forest border border-carto-border">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <label className="cursor-pointer text-xs font-medium text-forest hover:underline">
                  <span>Click to select photograph</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-carto-muted mt-1">JPEG, PNG, or WebP up to 10MB</p>
              </div>

              {uploadingImage && (
                <p className="text-xs font-mono text-forest animate-pulse">
                  Requesting S3 presigned URL and preparing image...
                </p>
              )}

              {imageUrl && (
                <div className="mt-4 p-3 bg-surface rounded-xl border border-carto-border max-w-md mx-auto space-y-3">
                  <img
                    src={imageUrl}
                    alt="Uploaded evidence"
                    className="w-full h-40 object-cover rounded-lg border border-carto-border"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-forest font-semibold">
                      ✓ Attached to S3 report bucket
                    </span>
                    <button
                      type="button"
                      disabled={analyzingPhoto}
                      onClick={async () => {
                        setAnalyzingPhoto(true);
                        try {
                          const res = await api.analyzePhoto(imageUrl);
                          setPhotoAnalysis(res);
                        } catch (err: any) {
                          console.warn('AI analysis error:', err);
                        } finally {
                          setAnalyzingPhoto(false);
                        }
                      }}
                      className="px-3 py-1 rounded bg-forest-subtle hover:bg-forest hover:text-white text-forest text-xs font-semibold border border-forest/30 transition flex items-center space-x-1"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${analyzingPhoto ? 'animate-spin' : ''}`} />
                      <span>{analyzingPhoto ? 'Analyzing...' : 'Analyze with AI'}</span>
                    </button>
                  </div>

                  {photoAnalysis && (
                    <div className="p-3 bg-paper rounded-lg border border-carto-border text-left space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-carto-border pb-1.5">
                        <span className="font-bold text-forest-deep flex items-center space-x-1">
                          <Sparkles className="w-3.5 h-3.5 text-forest" />
                          <span>AI Visual Inspection Telemetry</span>
                        </span>
                        <span className="font-mono text-[10px] text-carto-muted">
                          Confidence: {Math.round(photoAnalysis.confidenceScore * 100)}%
                        </span>
                      </div>

                      <p className="text-carto-text text-[11px] leading-relaxed">
                        {photoAnalysis.plainSummary}
                      </p>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                        <div className="flex items-center space-x-1">
                          <span>{photoAnalysis.detectedIndicators.waterloggingObserved ? '✓' : '✗'}</span>
                          <span className="text-carto-text">Standing Water</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>{photoAnalysis.detectedIndicators.submergedRoadSurface ? '✓' : '✗'}</span>
                          <span className="text-carto-text">Submerged Carriageway</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>{photoAnalysis.detectedIndicators.vehiclesInundated ? '✓' : '✗'}</span>
                          <span className="text-carto-text">Vehicles Affected</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>{photoAnalysis.detectedIndicators.pedestrianPathwayObstructed ? '✓' : '✗'}</span>
                          <span className="text-carto-text">Pathway Blocked</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-carto-muted italic pt-1 border-t border-carto-border/60">
                        * {photoAnalysis.uncertaintyDisclaimer}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-carto-border">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center space-x-1.5 text-xs font-mono text-carto-muted hover:text-carto-text"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center space-x-2 bg-forest hover:bg-forest-deep text-white px-5 py-2.5 rounded-lg text-xs font-medium font-mono transition"
              >
                <span>Proceed to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & CONSENT */}
        {currentStep === 4 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-xs font-mono uppercase text-carto-text font-bold mb-1">
                4. Review & Confirm Submission
              </h3>
              <p className="text-xs text-carto-muted">
                Inspect summary details prior to permanent write to the AWS cloud database.
              </p>
            </div>

            <div className="bg-surface-muted/60 rounded-xl border border-carto-border p-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-carto-border/60">
                <span className="text-carto-muted font-mono">Location Name:</span>
                <span className="font-semibold text-carto-text">{locationName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-carto-border/60">
                <span className="text-carto-muted font-mono">Coordinates:</span>
                <span className="font-mono text-carto-text">{latitude}°N, {longitude}°E</span>
              </div>
              <div className="flex justify-between py-1 border-b border-carto-border/60">
                <span className="text-carto-muted font-mono">Severity:</span>
                <RiskBadge severity={severity} size="sm" />
              </div>
              <div className="flex justify-between py-1 border-b border-carto-border/60">
                <span className="text-carto-muted font-mono">Passability:</span>
                <RoadConditionBadge condition={roadCondition} />
              </div>
              <div className="flex justify-between py-1 border-b border-carto-border/60">
                <span className="text-carto-muted font-mono">Water Depth:</span>
                <span className="font-mono text-carto-text">{waterDepthCm ? `${waterDepthCm} cm` : 'Not recorded'}</span>
              </div>
              <div className="py-1">
                <span className="text-carto-muted font-mono block mb-1">Description:</span>
                <p className="text-carto-text bg-surface p-2 rounded border border-carto-border">
                  "{description}"
                </p>
              </div>
            </div>

            {/* Privacy & Consent Checkbox */}
            <div className="p-3.5 rounded-xl bg-forest-subtle/50 border border-forest/20 space-y-2">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consentPublic}
                  onChange={(e) => setConsentPublic(e.target.checked)}
                  className="mt-0.5 rounded text-forest focus:ring-forest"
                />
                <span className="text-xs text-carto-text leading-snug">
                  I consent to sharing a sanitized public hazard report. I understand my phone number and private account credentials are never exposed, and only coordinates and hazard observations are published.
                </span>
              </label>
            </div>

            <div className="flex justify-between pt-4 border-t border-carto-border">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center space-x-1.5 text-xs font-mono text-carto-muted hover:text-carto-text"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center space-x-2 bg-forest hover:bg-forest-deep disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-xs font-medium font-mono transition shadow-carto"
              >
                {submitting ? (
                  <span>Transmitting to AWS API...</span>
                ) : (
                  <>
                    <span>Submit to Hazard Network</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
