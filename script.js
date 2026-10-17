
(function () {
  const SUPABASE_URL = "https://drybwiuqbjcjpftsujew.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qz-i_dtJ9_Z4EQvfk9i5sQ_yVycmcBX";

  function startApp() {
    const $ = (id) => document.getElementById(id);

    const welcome = $("welcome-section");
    const login = $("auth-section");
    const signup = $("signup-section");
    const dashboard = $("private-content");

    const supabaseLib = window.supabase;

    if (!supabaseLib || !supabaseLib.createClient) {
      console.error("Supabase library did not load.");
      alert("Supabase failed to load. Refresh the preview and try again.");
      return;
    }

    const db = supabaseLib.createClient(SUPABASE_URL, SUPABASE_KEY);

    function showScreen(screen) {
      if (welcome) welcome.hidden = screen !== "welcome";
      if (login) login.hidden = screen !== "login";
      if (signup) signup.hidden = screen !== "signup";
      if (dashboard) dashboard.hidden = screen !== "dashboard";
    }

    // Welcome navigation
    $("show-login")?.addEventListener("click", () => showScreen("login"));
    $("show-signup")?.addEventListener("click", () => showScreen("signup"));
    $("back-to-welcome")?.addEventListener("click", () => showScreen("welcome"));
    $("back-to-welcome-signup")?.addEventListener("click", () => showScreen("welcome"));

    let currentUser = null;
    let tasks = [];

    function showMessage(id, message, isError = false) {
      const element = $(id);
      if (element) {
        element.textContent = message;
        element.style.color = isError ? "#ff8b8b" : "#a7f3d0";
      }
    }

    function setBusy(id, busy) {
      const button = $(id);
      if (button) button.disabled = busy;
    }

    // Load tasks belonging to the signed-in user
    async function loadTasks() {
      if (!currentUser) return;

      const { data, error } = await db
        .from("tasks")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Loading tasks failed:", error);
        alert("Couldn't load tasks: " + error.message);
        return;
      }

      tasks = data || [];
      renderTasks();
    }

    function renderTasks() {
      const activeList = $("task-list");
      const completedList = $("completed-list");

      if (!activeList || !completedList) return;

      activeList.replaceChildren();
      completedList.replaceChildren();

      const active = tasks.filter((task) => !task.completed_at);
      const completed = tasks.filter((task) => task.completed_at);

      function makeTaskRow(task, isCompleted) {
        const row = document.createElement("div");
        row.style.cssText =
          "display:flex;align-items:center;gap:10px;padding:12px;" +
          "margin-bottom:8px;background:#29292f;border-radius:10px;";

        const title = document.createElement("span");
        title.textContent = task.title;
        title.style.cssText = "flex:1;overflow-wrap:anywhere;";

        if (isCompleted) {
          title.style.textDecoration = "line-through";
          title.style.opacity = "0.65";
        }

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.textContent = isCompleted ? "Undo" : "Complete";
        toggle.addEventListener("click", () => toggleTask(task));

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Delete";
        remove.addEventListener("click", () => deleteTask(task));

        row.append(title, toggle, remove);
        return row;
      }

      active.forEach((task) => {
        activeList.appendChild(makeTaskRow(task, false));
      });

      completed.forEach((task) => {
        completedList.appendChild(makeTaskRow(task, true));
      });

      const total = tasks.length;
      const done = completed.length;
      const remaining = total - done;
      const rate = total ? Math.round((done / total) * 100) : 0;

      if ($("total-tasks")) $("total-tasks").textContent = total;
      if ($("dashboard-completed")) $("dashboard-completed").textContent = done;
      if ($("remaining-tasks")) $("remaining-tasks").textContent = remaining;
      if ($("completion-rate")) $("completion-rate").textContent = rate + "%";

      if ($("progress")) {
        $("progress").textContent = `Completed: ${done} of ${total} tasks`;
      }

      if ($("progress-fill")) $("progress-fill").style.width = rate + "%";
      if ($("dashboard-progress-fill")) {
        $("dashboard-progress-fill").style.width = rate + "%";
      }
    }

    async function toggleTask(task) {
      const completedAt = task.completed_at ? null : new Date().toISOString();

      const { error } = await db
        .from("tasks")
        .update({ completed_at: completedAt })
        .eq("id", task.id)
        .eq("user_id", currentUser.id);

      if (error) {
        alert("Couldn't update task: " + error.message);
        return;
      }

      await loadTasks();
    }

    async function deleteTask(task) {
      if (!confirm(`Delete "${task.title}"?`)) return;

      const { error } = await db
        .from("tasks")
        .delete()
        .eq("id", task.id)
        .eq("user_id", currentUser.id);

      if (error) {
        alert("Couldn't delete task: " + error.message);
        return;
      }

      await loadTasks();
    }

    // Create a task
    $("add-task")?.addEventListener("click", async () => {
      if (!currentUser) return;

      const input = $("new-task");
      const title = input?.value.trim();

      if (!title) {
        alert("Type a task first.");
        input?.focus();
        return;
      }

      const button = $("add-task");
      if (button) button.disabled = true;

      const { error } = await db.from("tasks").insert({
        user_id: currentUser.id,
        title: title
      });

      if (button) button.disabled = false;

      if (error) {
        alert("Couldn't add task: " + error.message);
        return;
      }

      input.value = "";
      await loadTasks();
    });

    // Login
    $("auth-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      setBusy("login-button", true);
      showMessage("auth-message", "");

      const email = $("auth-email").value.trim();
      const password = $("auth-password").value;

      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      setBusy("login-button", false);

      if (error) {
        showMessage("auth-message", error.message, true);
        return;
      }

      await enterDashboard(data.user);
    });

    // Create account
    $("signup-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      setBusy("signup-button", true);
      showMessage("signup-message", "");

      const email = $("signup-email").value.trim();
      const password = $("signup-password").value;

      const { data, error } = await db.auth.signUp({
        email,
        password
      });

      setBusy("signup-button", false);

      if (error) {
        showMessage("signup-message", error.message, true);
        return;
      }

      if (data.session && data.user) {
        await enterDashboard(data.user);
      } else {
        showMessage(
          "signup-message",
          "Account created! Check your email to confirm your account, then log in."
        );
      }
    });

    async function enterDashboard(user) {
      currentUser = user;
      showScreen("dashboard");
      await loadTasks();
    }

    // Logout
    $("logout-button")?.addEventListener("click", async () => {
      const { error } = await db.auth.signOut();

      if (error) {
        alert("Couldn't log out: " + error.message);
        return;
      }

      currentUser = null;
      tasks = [];
      showScreen("welcome");
    });

    // Restore an existing login when the page is refreshed
    async function restoreSession() {
      const { data, error } = await db.auth.getSession();

      if (error) {
        console.error("Could not restore session:", error);
        showScreen("welcome");
        return;
      }

      if (data.session?.user) {
        await enterDashboard(data.session.user);
      } else {
        showScreen("welcome");
      }
    }

    db.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        currentUser = null;
        tasks = [];
        showScreen("welcome");
      }
    });

    restoreSession();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp, { once: true });
  } else {
    startApp();
  }
})();
