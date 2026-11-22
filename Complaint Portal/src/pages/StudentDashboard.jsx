import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { apiRequest } from "../lib/api.js";

const labels = {
  pending: "Pending",
  in_progress: "In progress",
  resolved: "Resolved",
  rejected: "Rejected",
};
const categories = [
  "Academic Issues",
  "Infrastructure & Facilities",
  "Faculty & Staff",
  "Hostel & Accommodation",
  "Food & Canteen",
  "Safety & Security",
  "Fees & Administration",
  "Transportation",
  "Other Issues",
];
const categoryById = {
  academic: "Academic Issues",
  infrastructure: "Infrastructure & Facilities",
  faculty: "Faculty & Staff",
  hostel: "Hostel & Accommodation",
  food: "Food & Canteen",
  safety: "Safety & Security",
  fees: "Fees & Administration",
  transport: "Transportation",
  other: "Other Issues",
};
const demoComplaints = [
  {
    id: "DEMO-001",
    title: "Projector not working in Lab 2",
    description:
      "The projector has not been working during practical sessions.",
    category: "Infrastructure & Facilities",
    status: "pending",
    created_at: "2026-10-29T09:15:00Z",
    user_id: "demo-student",
    student_name: "Demo Student",
    admin_remarks: "",
  },
  {
    id: "DEMO-002",
    title: "Need clarification on assignment deadline",
    description: "Requesting confirmation of the revised submission date.",
    category: "Academic Issues",
    status: "in_progress",
    created_at: "2026-10-27T12:30:00Z",
    user_id: "demo-student",
    student_name: "Demo Student",
    admin_remarks: "Forwarded to the department.",
  },
  {
    id: "DEMO-003",
    title: "Library access card issue",
    description: "My card is not allowing entry to the library.",
    category: "Other Issues",
    status: "resolved",
    created_at: "2026-10-24T08:00:00Z",
    user_id: "demo-student",
    student_name: "Demo Student",
    admin_remarks: "Access has been restored.",
  },
];
const evidenceCategories = new Set([
  "Safety & Security",
  "Food & Canteen",
  "Hostel & Accommodation",
  "Infrastructure & Facilities",
]);
const allowedEvidenceTypes = ["image/jpeg", "image/png", "image/webp"];
const maxEvidenceSize = 5 * 1024 * 1024;
const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

export default function StudentDashboard({ session, profile, onSignOut, onProfileUpdated }) {
  const admin = false;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceUploading, setEvidenceUploading] = useState(false);
  const [category, setCategory] = useState(() => {
    const selectedCategory = sessionStorage.getItem("selectedComplaintCategory");
    if (selectedCategory) {
      sessionStorage.removeItem("selectedComplaintCategory");
      return categoryById[selectedCategory] || categories[1];
    }
    return categories[1];
  });
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [profileName, setProfileName] = useState(profile?.full_name || "");
  const [studentProfile, setStudentProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || "", phone: "", date_of_birth: "", gender: "",
    alternate_phone: "", alternate_email: "", current_address: "",
    permanent_address: "", city: "", state: "", pincode: "", avatar_url: "",
  });
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [remarks, setRemarks] = useState({});
  const [demoMode, setDemoMode] = useState(!supabase);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (!supabase) {
      setItems(demoComplaints.filter((x) => x.user_id === "demo-student"));
      setDemoMode(true);
      setLoading(false);
      return;
    }

    try {
      const result = await apiRequest("/complaints", { session });
      setItems(result.complaints || []);
      setDemoMode(false);
    } catch (requestError) {
      setError(requestError.message || "Could not fetch your complaints.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const loadStudentProfile = useCallback(async () => {
    if (!supabase || !session?.user?.id) return;
    setProfileLoading(true);
    setProfileError("");
    try {
      const { data, error: loadError } = await supabase
        .from("profiles")
        .select("full_name,phone,crn_number,department,course,semester,academic_session,date_of_birth,gender,alternate_phone,alternate_email,current_address,permanent_address,city,state,pincode,avatar_url")
        .eq("id", session.user.id)
        .maybeSingle();
      if (loadError) throw loadError;
      if (!data) {
        throw new Error("Your student profile was not found. Please contact the portal administrator.");
      }

      setStudentProfile(data);
      setProfileName(data.full_name || "");
      setProfileForm({
        full_name: data.full_name || "", phone: data.phone || "",
        date_of_birth: data.date_of_birth || "", gender: data.gender || "",
        alternate_phone: data.alternate_phone || "", alternate_email: data.alternate_email || "",
        current_address: data.current_address || "", permanent_address: data.permanent_address || "",
        city: data.city || "", state: data.state || "", pincode: data.pincode || "",
        avatar_url: data.avatar_url || "",
      });

      if (data.avatar_url) {
        const { data: signed, error: signedError } = await supabase.storage
          .from("student-avatars")
          .createSignedUrl(data.avatar_url, 3600);
        if (signedError) throw signedError;
        setProfileAvatarUrl(signed.signedUrl);
      } else {
        setProfileAvatarUrl("");
      }
    } catch (loadError) {
      setProfileError(loadError.message || "Could not load your profile.");
    } finally {
      setProfileLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadStudentProfile();
  }, [loadStudentProfile]);

  useEffect(() => {
    if (!supabase || !session?.user?.id) return undefined;

    const channel = supabase
      .channel("student-complaints-" + session.user.id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaints",
          filter: "user_id=eq." + session.user.id,
        },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, session?.user?.id]);

  useEffect(() => {
    if (sessionStorage.getItem("focusComplaintForm") === "true") {
      sessionStorage.removeItem("focusComplaintForm");
      requestAnimationFrame(() => {
        document
          .getElementById("raise-complaint-form")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  async function saveStudentProfile(e) {
    e.preventDefault();
    setProfileError("");
    setProfileNotice("");
    const fullName = profileForm.full_name.trim();
    const phoneValue = profileForm.phone.trim();
    const alternatePhone = profileForm.alternate_phone.trim();
    const pincode = profileForm.pincode.trim();

    if (fullName.length < 2 || fullName.length > 120) {
      setProfileError("Full name must be between 2 and 120 characters.");
      return;
    }
    if (!/^[0-9+() -]{7,20}$/.test(phoneValue)) {
      setProfileError("Enter a valid contact number (7–20 characters).");
      return;
    }
    if (alternatePhone && !/^[0-9+() -]{7,20}$/.test(alternatePhone)) {
      setProfileError("Enter a valid alternate contact number.");
      return;
    }
    if (pincode && !/^\d{4,10}$/.test(pincode)) {
      setProfileError("PIN code must contain 4–10 digits.");
      return;
    }

    setProfileSaving(true);
    const update = {
      full_name: fullName, phone: phoneValue,
      date_of_birth: profileForm.date_of_birth || null,
      gender: profileForm.gender || null,
      alternate_phone: alternatePhone || null,
      alternate_email: profileForm.alternate_email.trim() || null,
      current_address: profileForm.current_address.trim() || null,
      permanent_address: profileForm.permanent_address.trim() || null,
      city: profileForm.city.trim() || null,
      state: profileForm.state.trim() || null,
      pincode: pincode || null,
      avatar_url: profileForm.avatar_url || null,
    };

    try {
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update(update)
        .eq("id", session.user.id)
        .select("full_name,phone,crn_number,department,course,semester,academic_session,date_of_birth,gender,alternate_phone,alternate_email,current_address,permanent_address,city,state,pincode,avatar_url")
        .single();
      if (updateError) throw updateError;
      setStudentProfile(data);
      setProfileName(data.full_name || "");
      onProfileUpdated?.({ full_name: data.full_name });
      setProfileEditing(false);
      setProfileNotice("Your profile has been updated successfully.");
      if (data.avatar_url) {
        const { data: signed } = await supabase.storage
          .from("student-avatars")
          .createSignedUrl(data.avatar_url, 3600);
        setProfileAvatarUrl(signed?.signedUrl || "");
      }
    } catch (saveError) {
      setProfileError(saveError.message || "Could not update your profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function uploadStudentAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileError("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Profile photo must be 2 MB or smaller.");
      return;
    }
    setAvatarUploading(true);
    setProfileError("");
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const path = session.user.id + "/" + crypto.randomUUID() + "." + extension;
    try {
      const { error: uploadError } = await supabase.storage
        .from("student-avatars")
        .upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data: signed, error: signedError } = await supabase.storage
        .from("student-avatars")
        .createSignedUrl(path, 3600);
      if (signedError) throw signedError;
      setProfileForm((old) => ({ ...old, avatar_url: path }));
      setProfileAvatarUrl(signed.signedUrl);
      setProfileNotice("Photo uploaded. Save your profile to keep this change.");
    } catch (uploadError) {
      setProfileError(uploadError.message || "Could not upload profile photo.");
    } finally {
      setAvatarUploading(false);
    }
  }

  function cancelProfileEdit() {
    setProfileEditing(false);
    setProfileError("");
    setProfileNotice("");
    if (!studentProfile) return;
    setProfileForm({
      full_name: studentProfile.full_name || "", phone: studentProfile.phone || "",
      date_of_birth: studentProfile.date_of_birth || "", gender: studentProfile.gender || "",
      alternate_phone: studentProfile.alternate_phone || "", alternate_email: studentProfile.alternate_email || "",
      current_address: studentProfile.current_address || "", permanent_address: studentProfile.permanent_address || "",
      city: studentProfile.city || "", state: studentProfile.state || "", pincode: studentProfile.pincode || "",
      avatar_url: studentProfile.avatar_url || "",
    });
    if (studentProfile.avatar_url) {
      supabase.storage.from("student-avatars")
        .createSignedUrl(studentProfile.avatar_url, 3600)
        .then(({ data }) => setProfileAvatarUrl(data?.signedUrl || ""));
    } else {
      setProfileAvatarUrl("");
    }
  }

  async function create(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (evidenceFile && !evidenceCategories.has(category)) {
      setError("Image evidence is available only for the four supported grievance categories.");
      return;
    }
    if (evidenceFile && (!allowedEvidenceTypes.includes(evidenceFile.type) || evidenceFile.size > maxEvidenceSize)) {
      setError("Choose a JPG, PNG or WebP image up to 5 MB.");
      return;
    }
    if (demoMode || !supabase) {
      const referenceId = `CP-${new Date().getFullYear()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
      setItems((old) => [
        {
          id: "DEMO-" + Date.now(),
          reference_id: referenceId,
          title: title.trim(),
          description: description.trim(),
          category,
          status: "pending",
          created_at: new Date().toISOString(),
          user_id: "demo-student",
          student_name: profileName || "Demo Student",
        },
        ...old,
      ]);
      setTitle("");
      setDescription("");
      setEvidenceFile(null);
      setNotice(
        `Demo complaint ID: ${referenceId}. This is a local preview only, not saved to the database.`,
      );
      return;
    }

    let uploadedEvidencePath = null;
    setEvidenceUploading(Boolean(evidenceFile));
    try {
      if (evidenceFile) {
        const extension = evidenceFile.type === "image/jpeg" ? "jpg" : evidenceFile.type.split("/")[1];
        uploadedEvidencePath = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("complaint-evidence")
          .upload(uploadedEvidencePath, evidenceFile, {
            cacheControl: "3600",
            contentType: evidenceFile.type,
            upsert: false,
          });
        if (uploadError) throw uploadError;
      }

      const result = await apiRequest("/complaints", {
        session,
        method: "POST",
        body: {
          title: title.trim(),
          description: description.trim(),
          category,
          evidence_path: uploadedEvidencePath,
        },
      });
      const createdComplaint = result.complaint;
      setTitle("");
      setDescription("");
      setEvidenceFile(null);
      setItems((old) => [createdComplaint, ...old]);
      setNotice(
        `Complaint submitted successfully. Your database reference ID is ${createdComplaint.reference_id}.`,
      );
      await load();
    } catch (requestError) {
      if (uploadedEvidencePath) {
        await supabase.storage.from("complaint-evidence").remove([uploadedEvidencePath]).catch(() => {});
      }
      setError(requestError.message || "Could not submit your complaint.");
    } finally {
      setEvidenceUploading(false);
    }
  }

  async function changeStatus(id, status) {
    if (demoMode || String(id).startsWith("DEMO-")) {
      setItems((old) => old.map((x) => (x.id === id ? { ...x, status } : x)));
      setNotice("Demo status changed locally only.");
      return;
    }

    setError("");
    setNotice("");
    try {
      const currentComplaint = items.find((item) => item.id === id);
      await apiRequest(`/admin/complaints/${encodeURIComponent(id)}/status`, {
        session,
        method: "PATCH",
        body: {
          status,
          admin_remarks: remarks[id] ?? currentComplaint?.admin_remarks ?? "",
        },
      });
      setNotice("Complaint updated.");
      await load();
    } catch (requestError) {
      setError(requestError.message || "Could not update the complaint.");
    }
  }

  const visibleItems = useMemo(
    () =>
      items.filter(
        (x) =>
          (filter === "all" || x.status === filter) &&
          (
            x.title +
            " " +
            x.description +
            " " +
            x.category +
            " " +
            (x.reference_id || "") +
            " " +
            (x.student_name || "")
          )
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, filter, query],
  );
  const counts = items.reduce(
    (a, x) => ((a[x.status] = (a[x.status] || 0) + 1), a),
    {},
  );
  const categoryCounts = categories
    .map((name) => ({
      name,
      count: items.filter((x) => x.category === name).length,
    }))
    .filter((x) => x.count)
    .sort((a, b) => b.count - a.count);
  const stats = [
    ["Total complaints", items.length, "layers"],
    ["Pending", counts.pending || 0, "clock"],
    ["In progress", counts.in_progress || 0, "activity"],
    ["Resolved", counts.resolved || 0, "check-circle"],
    ["Rejected", counts.rejected || 0, "x-circle"],
  ];

  return (
    <section
      className={"dashboard-wrap " + (!admin ? "student-dashboard-shell" : "")}
    >
      {!admin && (
        <aside className="student-sidebar">
          <div className="student-sidebar-label">MENU</div>
          <button
            className="active"
            onClick={() =>
              document
                .getElementById("student-dashboard-content")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>▦</span>Dashboard
          </button>
          <button
            onClick={() =>
              document
                .getElementById("raise-complaint-form")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>▤</span>Raise Complaint
          </button>
          <button
            onClick={() =>
              document
                .getElementById("student-complaint-history")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>▧</span>My Complaints
          </button>
          <button
            onClick={() =>
              document
                .getElementById("student-profile")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>♙</span>Profile
          </button>
          <button className="student-sidebar-logout" onClick={onSignOut}>
            <span>↪</span>Logout
          </button>
          <div className="student-sidebar-footer">
            Campus Grievance System
            <br />
            <small>Student services</small>
          </div>
        </aside>
      )}
      <div className="student-main-content" id="student-dashboard-content">
        <div
          className={
            "dashboard-top " + (!admin ? "student-dashboard-title-hidden" : "")
          }
        >
          <div>
            <span className="eyebrow">
              {admin ? "ADMINISTRATION / OVERVIEW" : "STUDENT PORTAL"}
            </span>
            <h1>{admin ? "Admin Dashboard" : "Student Dashboard"}</h1>
            <p>
              {admin
                ? "Welcome back, " +
                  (profile?.full_name || session?.user?.email || "there") +
                  ". Here is your campus grievance overview."
                : "Track and manage your campus complaints in one place."}
            </p>
          </div>
          <div className="dashboard-top-actions">
            {!admin && (
              <span className="student-user-chip">
                <span className="student-user-avatar">♙</span>
                <span>
                  <strong>
                    {profile?.full_name ||
                      session?.user?.email?.split("@")[0] ||
                      "Student"}
                  </strong>
                  <small>Student</small>
                </span>
              </span>
            )}
            {admin && (
              <>
                <span className="dashboard-role">Admin access</span>
                <button className="btn btn-outline" onClick={onSignOut}>
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
        {demoMode && (
          <div className="dashboard-demo-note">
            <strong>Preview / demo data</strong>
            <span>
              Sample complaints are illustrative only. Changes in demo mode stay
              in this browser session and are not saved to Supabase.
            </span>
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="info" role="status">
            {notice}
          </p>
        )}
        {!admin && (
          <div className="student-welcome-panel">
            <div>
              <span className="eyebrow">STUDENT OVERVIEW</span>
              <h2>Your campus, your voice.</h2>
              <p>Submit concerns and follow their resolution progress.</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() =>
                document
                  .getElementById("raise-complaint-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              + Raise Complaint
            </button>
          </div>
        )}
        {!admin && (
          <section
            id="student-profile"
            className="dashboard-profile-card student-info-card"
          >
            {profileAvatarUrl ? (
              <img className="student-profile-avatar" src={profileAvatarUrl} alt="Student profile" />
            ) : (
              <span className="dashboard-avatar">
                {(studentProfile?.full_name || profile?.full_name || "S").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="student-info-content">
              <div className="student-profile-title-row">
                <div>
                  <span className="eyebrow">STUDENT INFORMATION</span>
                  <h2>{studentProfile?.full_name || profile?.full_name || "Student"}</h2>
                  <p className="student-profile-subtitle">Manage your personal and contact details</p>
                </div>
                <button type="button" className="btn btn-outline"
                  disabled={profileLoading || !studentProfile}
                  onClick={() => {
                    setProfileError("");
                    setProfileNotice("");
                    setProfileEditing((editing) => !editing);
                  }}>
                  {profileEditing ? "Close editor" : "Edit Profile"}
                </button>
              </div>
              {profileLoading && <p className="profile-feedback">Loading profile details…</p>}
              {profileError && <p className="error profile-feedback" role="alert">{profileError}</p>}
              {profileNotice && <p className="info profile-feedback" role="status">{profileNotice}</p>}

              <div className="student-info-grid">
                <div><small>EMAIL ADDRESS</small><strong>{session?.user?.email || "—"}</strong></div>
                <div><small>CONTACT NUMBER</small><strong>{studentProfile?.phone || "Not provided"}</strong></div>
                <div><small>DEPARTMENT</small><strong>{studentProfile?.department || "Not provided"}</strong></div>
                <div><small>CRN NUMBER</small><strong>{studentProfile?.crn_number || "Not provided"}</strong></div>
                <div><small>COURSE / PROGRAM</small><strong>{studentProfile?.course || "Not provided"}</strong></div>
                <div><small>SEMESTER</small><strong>{studentProfile?.semester ? "Semester " + studentProfile.semester : "Not provided"}</strong></div>
                <div><small>ACADEMIC SESSION</small><strong>{studentProfile?.academic_session || "Managed by administration"}</strong></div>
              </div>

              {profileEditing && (
                <form className="student-profile-form" onSubmit={saveStudentProfile}>
                  <div className="student-profile-form-heading">
                    <span className="eyebrow">PERSONAL & CONTACT DETAILS</span>
                    <p>Update your personal and contact details. Academic identity fields are protected and managed by the administration.</p>
                  </div>
                  <div className="student-profile-form-grid">
                    <label>Full name
                      <input value={profileForm.full_name}
                        onChange={(e) => setProfileForm((old) => ({ ...old, full_name: e.target.value }))}
                        minLength={2} maxLength={120} autoComplete="name" required />
                    </label>
                    <label>Primary contact number
                      <input type="tel" value={profileForm.phone}
                        onChange={(e) => setProfileForm((old) => ({ ...old, phone: e.target.value }))}
                        pattern="[0-9+() -]{7,20}" autoComplete="tel" required />
                    </label>
                    <label>Date of birth
                      <input type="date" value={profileForm.date_of_birth}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setProfileForm((old) => ({ ...old, date_of_birth: e.target.value }))} />
                    </label>
                    <label>Gender
                      <select value={profileForm.gender}
                        onChange={(e) => setProfileForm((old) => ({ ...old, gender: e.target.value }))}>
                        <option value="">Prefer not to say</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="non_binary">Non-binary</option>
                      </select>
                    </label>
                    <label>Alternate contact number
                      <input type="tel" value={profileForm.alternate_phone}
                        onChange={(e) => setProfileForm((old) => ({ ...old, alternate_phone: e.target.value }))}
                        pattern="[0-9+() -]{7,20}" />
                    </label>
                    <label>Alternate email
                      <input type="email" value={profileForm.alternate_email}
                        onChange={(e) => setProfileForm((old) => ({ ...old, alternate_email: e.target.value }))} />
                    </label>
                    <label className="profile-form-wide">Current address
                      <textarea rows={2} value={profileForm.current_address}
                        onChange={(e) => setProfileForm((old) => ({ ...old, current_address: e.target.value }))}
                        maxLength={500} />
                    </label>
                    <label className="profile-form-wide">Permanent address
                      <textarea rows={2} value={profileForm.permanent_address}
                        onChange={(e) => setProfileForm((old) => ({ ...old, permanent_address: e.target.value }))}
                        maxLength={500} />
                    </label>
                    <label>City
                      <input value={profileForm.city}
                        onChange={(e) => setProfileForm((old) => ({ ...old, city: e.target.value }))}
                        maxLength={100} />
                    </label>
                    <label>State
                      <input value={profileForm.state}
                        onChange={(e) => setProfileForm((old) => ({ ...old, state: e.target.value }))}
                        maxLength={100} />
                    </label>
                    <label>PIN code
                      <input inputMode="numeric" value={profileForm.pincode}
                        onChange={(e) => setProfileForm((old) => ({ ...old, pincode: e.target.value }))}
                        pattern="[0-9]{4,10}" maxLength={10} />
                    </label>
                    <label className="profile-form-wide">Profile photo (JPG, PNG or WebP · maximum 2 MB)
                      <input type="file" accept="image/jpeg,image/png,image/webp"
                        onChange={uploadStudentAvatar} disabled={avatarUploading} />
                      {avatarUploading && <small>Uploading photo…</small>}
                    </label>
                  </div>
                  <div className="student-profile-readonly">
                    <strong>Academic information · Admin managed</strong>
                    <span>CRN: {studentProfile?.crn_number || "Not provided"}</span>
                    <span>Department: {studentProfile?.department || "Not provided"}</span>
                    <span>Course: {studentProfile?.course || "Not provided"}</span>
                    <span>Semester: {studentProfile?.semester || "Not provided"}</span>
                    <span>Academic session: {studentProfile?.academic_session || "Not assigned"}</span>
                  </div>
                  <div className="student-profile-actions">
                    <button type="button" className="btn btn-outline" onClick={cancelProfileEdit}
                      disabled={profileSaving || avatarUploading}>Cancel</button>
                    <button type="submit" className="btn btn-primary"
                      disabled={profileSaving || avatarUploading || profileLoading}>
                      {profileSaving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        )}
        <div className="dashboard-stats">
          {stats.map(([label, number, icon], i) => (
            <div className="dashboard-stat-card" key={label}>
              <span className={"dashboard-stat-icon stat-icon-" + i}>
                {icon === "layers"
                  ? "▤"
                  : icon === "clock"
                    ? "◷"
                    : icon === "activity"
                      ? "↗"
                      : icon === "x-circle" ? "✕" : "✓"}
              </span>
              <small>{label}</small>
              <strong>{number}</strong>
              <span className="dashboard-stat-foot">
                {i === 0 ? "Your submitted complaints" : "Current status"}
              </span>
            </div>
          ))}
        </div>
        {!admin ? (
          <>
            <div className="dashboard-section-heading">
              <div>
                <span className="eyebrow">QUICK ACTION</span>
                <h2>Raise a new complaint</h2>
                <p>
                  Share the details so the right team can review your concern.
                </p>
              </div>
            </div>
            <form
              id="raise-complaint-form"
              className="dashboard-form"
              onSubmit={create}
            >
              <label>
                Complaint title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  minLength={3}
                  maxLength={160}
                  required
                  placeholder="e.g. Classroom projector not working"
                />
              </label>
              <label>
                Grievance category
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (!evidenceCategories.has(e.target.value)) setEvidenceFile(null);
                  }}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              {evidenceCategories.has(category) && (
                <label className="complaint-evidence-upload">
                  Supporting image (optional)
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      e.target.value = "";
                      if (!file) return;
                      if (!allowedEvidenceTypes.includes(file.type) || file.size > maxEvidenceSize) {
                        setError("Choose a JPG, PNG or WebP image up to 5 MB.");
                        setEvidenceFile(null);
                        return;
                      }
                      setError("");
                      setEvidenceFile(file);
                    }}
                  />
                  <small>Upload one JPG, PNG or WebP image (maximum 5 MB) to help explain the issue.</small>
                  {evidenceFile && (
                    <span className="complaint-evidence-selected">
                      {evidenceFile.name} · {(evidenceFile.size / (1024 * 1024)).toFixed(2)} MB
                      <button type="button" onClick={() => setEvidenceFile(null)}>Remove</button>
                    </span>
                  )}
                </label>
              )}
              <label>
                Describe your concern
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minLength={10}
                  maxLength={10000}
                  rows={4}
                  required
                  placeholder="Include relevant details, location and when the issue occurred."
                />
              </label>
              <div className="dashboard-form-footer">
                <small>
                  Please avoid including passwords or unnecessary sensitive
                  information.
                </small>
                <button className="btn btn-primary" type="submit" disabled={evidenceUploading}>
                  {evidenceUploading ? "Uploading image…" : "Submit complaint"} <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
            <div
              className="dashboard-section-heading"
              id="student-complaint-history"
            >
              <div>
                <span className="eyebrow">YOUR RECORDS</span>
                <h2>My complaints</h2>
                <p>
                  Follow each complaint's progress and read administrator
                  updates.
                </p>
              </div>
              <button className="btn btn-outline" onClick={load}>
                ↻ Refresh
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="dashboard-admin-grid">
              <section className="dashboard-panel">
                <div className="dashboard-panel-title">
                  <div>
                    <span className="eyebrow">INSIGHTS</span>
                    <h2>Complaints by category</h2>
                  </div>
                </div>
                {categoryCounts.length ? (
                  categoryCounts.map((c) => (
                    <div className="category-bar-row" key={c.name}>
                      <div>
                        <span>{c.name}</span>
                        <strong>{c.count}</strong>
                      </div>
                      <div className="category-bar-track">
                        <span
                          style={{
                            width:
                              Math.max(
                                6,
                                (c.count / Math.max(1, items.length)) * 100,
                              ) + "%",
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="dashboard-empty">
                    Category insights will appear when complaints are available.
                  </p>
                )}
              </section>
              <section className="dashboard-panel">
                <span className="eyebrow">WORK QUEUE</span>
                <h2>Needs attention</h2>
                <div className="queue-metric">
                  <strong>
                    {(counts.pending || 0) + (counts.in_progress || 0)}
                  </strong>
                  <span>complaints still open</span>
                </div>
                <p>
                  Review pending cases, update progress, and leave a clear
                  remark for students.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setFilter("pending");
                    document
                      .getElementById("complaint-management")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Review pending →
                </button>
              </section>
            </div>
            <div
              className="dashboard-section-heading"
              id="complaint-management"
            >
              <div>
                <span className="eyebrow">CASEWORK</span>
                <h2>Complaint management</h2>
                <p>
                  Search submissions, filter by status, and update case
                  progress.
                </p>
              </div>
              <button className="btn btn-outline" onClick={load}>
                ↻ Refresh
              </button>
            </div>
          </>
        )}
        <div className="dashboard-toolbar">
          <input
            aria-label="Search complaints"
            placeholder={
              admin
                ? "Search title, student or category…"
                : "Search your complaints…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Filter by status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {Object.entries(labels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p>Loading complaints…</p>
        ) : visibleItems.length === 0 ? (
          <p className="dashboard-empty">No complaints match this view yet.</p>
        ) : (
          <div className="dashboard-complaints">
            {visibleItems.map((x) => (
              <article className="dashboard-complaint" key={x.id}>
                <div className="complaint-heading">
                  <div>
                    <span className="complaint-category">{x.category}</span>
                    <h3>{x.title}</h3>
                    {admin && (
                      <small>
                        Submitted by {x.student_name || x.user_id || "Student"}
                      </small>
                    )}
                  </div>
                  <span className={"status-pill status-" + x.status}>
                    {labels[x.status] || x.status}
                  </span>
                </div>
                <p>{x.description}</p>
                <div className="dashboard-record-meta">
                  <small className="complaint-reference-id">
                    <strong>Reference ID:</strong> {x.reference_id || x.id}
                  </small>
                  <small>Submitted {dateLabel(x.created_at)}</small>
                </div>
                {x.evidence_signed_url && (
                  <div className="complaint-evidence-preview">
                    <strong>Supporting evidence</strong>
                    <a href={x.evidence_signed_url} target="_blank" rel="noreferrer">
                      <img src={x.evidence_signed_url} alt="Complaint supporting evidence" loading="lazy" />
                      <span>View full image ↗</span>
                    </a>
                  </div>
                )}
                {x.admin_remarks && (
                  <div className="dashboard-remark">
                    <strong>Administrator update</strong>
                    <p>{x.admin_remarks}</p>
                  </div>
                )}
                {admin && (
                  <div className="admin-case-actions">
                    <label className="status-control">
                      Update status
                      <select
                        value={x.status}
                        onChange={(e) => changeStatus(x.id, e.target.value)}
                      >
                        {Object.entries(labels).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                    {!String(x.id).startsWith("DEMO-") && (
                      <label className="status-control">
                        Remark for student
                        <input
                          value={remarks[x.id] ?? x.admin_remarks ?? ""}
                          onChange={(e) =>
                            setRemarks((old) => ({
                              ...old,
                              [x.id]: e.target.value,
                            }))
                          }
                          placeholder="Add an update or next step"
                        />
                      </label>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
