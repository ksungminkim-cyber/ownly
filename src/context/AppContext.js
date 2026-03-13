"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { DEFAULT_TENANTS, DEFAULT_PAYMENTS, PLANS } from "../lib/constants";

const AppContext = createContext(null);

function sbErr(error) {
  if (!error) return null;
  return new Error(error.message || error.details || error.hint || JSON.stringify(error));
}

// ─── tenants 변환 ─────────────────────────────────────────
function dbToApp(row) {
  if (!row) return row;
  return {
    ...row,
    sub:      row.sub_type,
    addr:     row.address,
    dep:      row.deposit,
    end_date: row.contract_end,
    biz:      row.business_name,
    color:    row.color || "#6366f1",
    contacts: row.contacts || [],
  };
}

function appToDb(data) {
  const d = { ...data };
  if ("sub"      in d) { d.sub_type      = d.sub;      delete d.sub; }
  if ("addr"     in d) { d.address       = d.addr;     delete d.addr; }
  if ("dep"      in d) { d.deposit       = d.dep;      delete d.dep; }
  if ("end_date" in d) { d.contract_end  = d.end_date; delete d.end_date; }
  if ("biz"      in d) { d.business_name = d.biz;      delete d.biz; }
  delete d.color;
  delete d.contacts;
  return d;
}

// ─── payments 변환 ────────────────────────────────────────
function payDbToApp(row) {
  if (!row) return row;
  return {
    ...row,
    tid:  row.tenant_id,
    paid: row.paid_date,
    amt:  row.amount,
  };
}

function payAppToDb(data) {
  const d = { ...data };
  if ("tid"  in d) { d.tenant_id = d.tid;  delete d.tid; }
  if ("paid" in d) { d.paid_date = d.paid; delete d.paid; }
  if ("amt"  in d) { d.amount    = d.amt;  delete d.amt; }
  if (!d.year) d.year = new Date().getFullYear();
  return d;
}

export function AppProvider({ children }) {
  const [tenants,      setTenantsState]   = useState([]);
  const [payments,     setPaymentsState]  = useState([]);
  const [contracts,    setContractsState] = useState([]);
  const [vacancies,    setVacanciesState] = useState([]);
  const [loading,      setLoading]        = useState(true);

  // ─── 구독/플랜 state ──────────────────────────────────
  const [user,         setUser]           = useState(null);
  const [userPlan,     setUserPlan]       = useState("free");
  const [subscription, setSubscription]   = useState(null);
  const [planLoading,  setPlanLoading]    = useState(true);

  // ─── 구독 정보 로드 ───────────────────────────────────
  const loadSubscription = useCallback(async (userId) => {
    try {
      setPlanLoading(true);
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data) {
        setSubscription(data);
        const isActive =
          data.status === "active" &&
          (!data.current_period_end || new Date(data.current_period_end) > new Date());
        setUserPlan(isActive ? (data.plan || "free") : "free");
      } else {
        setUserPlan("free");
        setSubscription(null);
      }
    } catch (err) {
      console.error("구독 정보 로딩 오류:", err);
      setUserPlan("free");
    } finally {
      setPlanLoading(false);
    }
  }, []);

  // ─── 유저 인증 감지 ───────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadSubscription(session.user.id);
      } else {
        setPlanLoading(false);
      }
    });

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadSubscription(session.user.id);
        } else {
          setUserPlan("free");
          setSubscription(null);
          setPlanLoading(false);
        }
      }
    );
    return () => authListener.unsubscribe();
  }, [loadSubscription]);

  // ─── 플랜 기능 체크 ───────────────────────────────────
  // canUse("reports")              → true/false (기능 잠금 체크)
  // canUse("properties", 현재개수) → 개수 제한 체크
  const canUse = useCallback((feature, currentCount = null) => {
    const plan = PLANS[userPlan] || PLANS.free;
    const limit = plan.limits[feature];
    if (limit === false) return false;
    if (limit === true || limit === Infinity) return true;
    if (typeof limit === "number" && currentCount !== null) {
      return currentCount < limit;
    }
    return true;
  }, [userPlan]);

  const getPlanLimit = useCallback((feature) => {
    const plan = PLANS[userPlan] || PLANS.free;
    return plan.limits[feature];
  }, [userPlan]);

  // ─── 데이터 로드 ──────────────────────────────────────
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [tenantsRes, paymentsRes, contractsRes, vacanciesRes] = await Promise.all([
        supabase.from("tenants").select("*").order("created_at", { ascending: false }),
        supabase.from("payments").select("*").order("created_at", { ascending: false }),
        supabase.from("contracts").select("*").order("created_at", { ascending: false }),
        supabase.from("vacancies").select("*").order("created_at", { ascending: false }),
      ]);
      setTenantsState(
        tenantsRes.data?.length ? tenantsRes.data.map(dbToApp) : DEFAULT_TENANTS
      );
      setPaymentsState(
        paymentsRes.data?.length ? paymentsRes.data.map(payDbToApp) : DEFAULT_PAYMENTS
      );
      setContractsState(contractsRes.data ?? []);
      setVacanciesState(vacanciesRes.data ?? []);
    } catch (err) {
      console.error("데이터 로딩 오류:", err);
      setTenantsState(DEFAULT_TENANTS);
      setPaymentsState(DEFAULT_PAYMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  // ─── 세입자 CRUD ─────────────────────────────────────
  const addTenant = async (data) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const dbData = { ...appToDb(data), user_id: currentUser?.id };
    const { data: inserted, error } = await supabase
      .from("tenants").insert([dbData]).select().single();
    if (error) throw sbErr(error);
    const mapped = dbToApp(inserted);
    setTenantsState((prev) => [mapped, ...prev]);
    return mapped;
  };

  const updateTenant = async (id, data) => {
    const { data: updated, error } = await supabase
      .from("tenants").update(appToDb(data)).eq("id", id).select().single();
    if (error) throw sbErr(error);
    const mapped = dbToApp(updated);
    setTenantsState((prev) => prev.map((t) => t.id === id ? mapped : t));
    return mapped;
  };

  const deleteTenant = async (id) => {
    const { error } = await supabase.from("tenants").delete().eq("id", id);
    if (error) throw sbErr(error);
    setTenantsState((prev) => prev.filter((t) => t.id !== id));
  };

  // ─── 공실 CRUD ──────────────────────────────────────
  const addVacancy = async (data) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const { data: inserted, error } = await supabase
      .from("vacancies")
      .insert([{ ...data, user_id: currentUser?.id }])
      .select().single();
    if (error) throw sbErr(error);
    setVacanciesState((prev) => [inserted, ...prev]);
    return inserted;
  };

  const deleteVacancy = async (id) => {
    const { error } = await supabase.from("vacancies").delete().eq("id", id);
    if (error) throw sbErr(error);
    setVacanciesState((prev) => prev.filter((v) => v.id !== id));
  };

  const setVacancies = setVacanciesState;

  // ─── 연락기록 CRUD ───────────────────────────────────
  const addContact = async (tenantId, data) => {
    const { data: inserted, error } = await supabase
      .from("contacts")
      .insert([{ tenant_id: tenantId, ...data }])
      .select()
      .single();
    if (error) throw sbErr(error);
    setTenantsState((prev) => prev.map((t) =>
      t.id === tenantId
        ? { ...t, contacts: [inserted, ...(t.contacts || [])] }
        : t
    ));
    return inserted;
  };

  const loadContacts = async (tenantId) => {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw sbErr(error);
    setTenantsState((prev) => prev.map((t) =>
      t.id === tenantId ? { ...t, contacts: data } : t
    ));
    return data;
  };

  const deleteContact = async (contactId, tenantId) => {
    const { error } = await supabase.from("contacts").delete().eq("id", contactId);
    if (error) throw sbErr(error);
    setTenantsState((prev) => prev.map((t) =>
      t.id === tenantId
        ? { ...t, contacts: (t.contacts || []).filter((c) => c.id !== contactId) }
        : t
    ));
  };

  const updateTenantContacts = async (id, contacts) => {
    setTenantsState((prev) => prev.map((t) => t.id === id ? { ...t, contacts } : t));
  };

  const updateTenantIntent = async (id, intent) => updateTenant(id, { intent });

  // ─── 수금 CRUD ───────────────────────────────────────
  const upsertPayment = async (data) => {
    const dbData = payAppToDb(data);
    const { data: upserted, error } = await supabase
      .from("payments")
      .upsert([dbData], { onConflict: "tenant_id,month,year" })
      .select().single();
    if (error) throw sbErr(error);
    const mapped = payDbToApp(upserted);
    setPaymentsState((prev) => {
      const filtered = prev.filter(
        (p) => !(p.tid === data.tid && p.month === data.month)
      );
      return [mapped, ...filtered];
    });
    return mapped;
  };

  const deletePayment = async (tid, month) => {
    const year = new Date().getFullYear();
    const { error } = await supabase.from("payments")
      .delete()
      .eq("tenant_id", tid)
      .eq("month", month)
      .eq("year", year);
    if (error) throw sbErr(error);
    setPaymentsState((prev) => prev.filter((p) => !(p.tid === tid && p.month === month)));
  };

  // ─── 계약 CRUD ───────────────────────────────────────
  const addContract = async (data) => {
    const { data: inserted, error } = await supabase
      .from("contracts").insert([data]).select().single();
    if (error) throw sbErr(error);
    setContractsState((prev) => [inserted, ...prev]);
    return inserted;
  };

  const updateContract = async (id, data) => {
    const { data: updated, error } = await supabase
      .from("contracts").update(data).eq("id", id).select().single();
    if (error) throw sbErr(error);
    setContractsState((prev) => prev.map((c) => c.id === id ? updated : c));
    return updated;
  };

  // ─── 전체 초기화 ─────────────────────────────────────
  const resetAllData = async () => {
    const results = await Promise.all([
      supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabase.from("contracts").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      supabase.from("tenants").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    ]);
    const err = results.find((r) => r.error);
    if (err) throw sbErr(err.error);
    await loadAllData();
  };

  return (
    <AppContext.Provider value={{
      // 데이터
      tenants, payments, contracts, vacancies, loading,
      // 세입자 CRUD
      addTenant, updateTenant, deleteTenant,
      updateTenantContacts, updateTenantIntent,
      addContact, loadContacts, deleteContact,
      // 공실 CRUD
      addVacancy, deleteVacancy, setVacancies,
      // 수금 CRUD
      upsertPayment, deletePayment,
      // 계약 CRUD
      addContract, updateContract,
      // 초기화
      refreshData: loadAllData,
      resetAllData,
      // 하위 호환 setter
      setTenants: setTenantsState,
      setPayments: setPaymentsState,
      setContracts: setContractsState,
      // ─── 구독/플랜 ───────────────────────────────────
      user,
      userPlan,
      subscription,
      planLoading,
      canUse,
      getPlanLimit,
      refreshSubscription: () => user && loadSubscription(user.id),
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
