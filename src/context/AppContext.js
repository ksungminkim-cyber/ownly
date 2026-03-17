"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { PLANS } from "../lib/constants";

const AppContext = createContext(null);

function sbErr(error) {
  if (!error) return null;
  return new Error(error.message || error.details || error.hint || JSON.stringify(error));
}

function dbToApp(row) {
  if (!row) return row;
  return {
    ...row,
    pType:      row.p_type     || row.pType     || "주거",
    sub:        row.sub_type   || row.sub        || "",
    addr:       row.address    || row.addr       || "",
    dep:        row.deposit    !== undefined ? row.deposit : (row.dep || 0),
    end_date:   row.contract_end || row.end_date || "",
    start_date: row.start_date || "",
    maintenance: row.maintenance || 0,
    biz:        row.business_name || row.biz || "",
    color:      row.color || "#6366f1",
    contacts:   row.contacts || [],
  };
}

function appToDb(data) {
  const d = { ...data };
  // 앱 필드명 → DB 컬럼명 변환
  if ("pType"    in d) { d.p_type        = d.pType;    delete d.pType; }
  if ("sub"      in d) { d.sub_type      = d.sub;      delete d.sub; }
  if ("addr"     in d) { d.address       = d.addr;     delete d.addr; }
  if ("dep"      in d) { d.deposit       = d.dep;      delete d.dep; }
  if ("end_date" in d) { d.contract_end  = d.end_date; delete d.end_date; }
  if ("biz"      in d) { d.business_name = d.biz;      delete d.biz; }
  // 불필요한 앱 전용 필드 제거
  delete d.color;
  delete d.contacts;
  return d;
}

function payDbToApp(row) {
  if (!row) return row;
  return {
    ...row,
    tid:  row.tenant_id,
    paid: row.paid_date,
    amt:  row.amount,
    maintenance_paid: row.maintenance_paid || false,
    maintenance_paid_date: row.maintenance_paid_date || null,
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
  const [aiUsage,      setAiUsageState]   = useState([]);
  const [vacancies,    setVacanciesState] = useState([]);
  const [loading,      setLoading]        = useState(true);
  const [user,         setUser]           = useState(null);
  const [userPlan,     setUserPlan]       = useState("free");
  const [subscription, setSubscription]   = useState(null);
  const [planLoading,  setPlanLoading]    = useState(true);

  const loadSubscription = useCallback(async (userId) => {
    try {
      setPlanLoading(true);
      const { data } = await supabase.from("subscriptions").select("*").eq("user_id", userId).single();
      if (data) {
        setSubscription(data);
        const isActive = data.status === "active" && (!data.current_period_end || new Date(data.current_period_end) > new Date());
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

  const loadAllData = useCallback(async (uid) => {
    try {
      setLoading(true);
      const userId = uid || (await supabase.auth.getUser()).data?.user?.id;
      if (!userId) {
        setTenantsState([]); setPaymentsState([]); setContractsState([]); setVacanciesState([]);
        return;
      }
      const tenantsRes = await supabase.from("tenants").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      const tenantIds = (tenantsRes.data ?? []).map((t) => t.id);
      const [paymentsRes, contractsRes, vacanciesRes] = await Promise.all([
        tenantIds.length ? supabase.from("payments").select("*").in("tenant_id", tenantIds).order("created_at", { ascending: false }) : { data: [] },
        tenantIds.length ? supabase.from("contracts").select("*").in("tenant_id", tenantIds).order("created_at", { ascending: false }) : { data: [] },
        supabase.from("vacancies").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);
      // ai_usage 이번 달 사용량 조회
      const now = new Date();
      const aiUsageRes = await supabase.from("ai_usage")
        .select("*").eq("user_id", userId)
        .eq("year", now.getFullYear()).eq("month", now.getMonth() + 1);

      setTenantsState(tenantsRes.data?.length ? tenantsRes.data.map(dbToApp) : []);
      setPaymentsState(paymentsRes.data?.length ? paymentsRes.data.map(payDbToApp) : []);
      setContractsState(contractsRes.data ?? []);
      setVacanciesState(vacanciesRes.data ?? []);
      setAiUsageState(aiUsageRes.data ?? []);
    } catch (err) {
      console.error("데이터 로딩 오류:", err);
      setTenantsState([]); setPaymentsState([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let realtimeChannel = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadSubscription(u.id);
        loadAllData(u.id);
        // Realtime 구독 — tenants/payments/contracts 변경 시 자동 새로고침
        realtimeChannel = supabase
          .channel("ownly-realtime")
          .on("postgres_changes", { event: "*", schema: "public", table: "tenants", filter: `user_id=eq.${u.id}` }, () => loadAllData(u.id))
          .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => loadAllData(u.id))
          .on("postgres_changes", { event: "*", schema: "public", table: "contracts" }, () => loadAllData(u.id))
          .on("postgres_changes", { event: "*", schema: "public", table: "vacancies", filter: `user_id=eq.${u.id}` }, () => loadAllData(u.id))
          .subscribe();
      } else {
        setPlanLoading(false); setLoading(false);
      }
    });

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadSubscription(u.id);
        loadAllData(u.id);
      } else {
        setUserPlan("free"); setSubscription(null); setPlanLoading(false);
        setTenantsState([]); setPaymentsState([]); setContractsState([]); setVacanciesState([]);
        setLoading(false);
      }
    });

    return () => {
      authListener.unsubscribe();
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, [loadSubscription, loadAllData]);

  const canUse = useCallback((feature, currentCount = null) => {
    const plan = PLANS[userPlan] || PLANS.free;
    const limit = plan.limits[feature];
    if (limit === false) return false;
    if (limit === true || limit === Infinity) return true;
    if (typeof limit === "number" && currentCount !== null) return currentCount < limit;
    return true;
  }, [userPlan]);

  const getPlanLimit = useCallback((feature) => {
    return (PLANS[userPlan] || PLANS.free).limits[feature];
  }, [userPlan]);

  const addTenant = async (data) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const dbData = { ...appToDb(data), user_id: currentUser?.id };
    const { data: inserted, error } = await supabase.from("tenants").insert([dbData]).select().single();
    if (error) throw sbErr(error);
    const mapped = dbToApp(inserted);
    setTenantsState((prev) => [mapped, ...prev]);
    return mapped;
  };

  const updateTenant = async (id, data) => {
    const { data: updated, error } = await supabase.from("tenants").update(appToDb(data)).eq("id", id).select().single();
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

  const addVacancy = async (data) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const { data: inserted, error } = await supabase.from("vacancies").insert([{ ...data, user_id: currentUser?.id }]).select().single();
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

  const addContact = async (tenantId, data) => {
    const { data: inserted, error } = await supabase.from("contacts").insert([{ tenant_id: tenantId, ...data }]).select().single();
    if (error) throw sbErr(error);
    setTenantsState((prev) => prev.map((t) => t.id === tenantId ? { ...t, contacts: [inserted, ...(t.contacts || [])] } : t));
    return inserted;
  };

  const loadContacts = async (tenantId) => {
    const { data, error } = await supabase.from("contacts").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    if (error) throw sbErr(error);
    setTenantsState((prev) => prev.map((t) => t.id === tenantId ? { ...t, contacts: data } : t));
    return data;
  };

  const deleteContact = async (contactId, tenantId) => {
    const { error } = await supabase.from("contacts").delete().eq("id", contactId);
    if (error) throw sbErr(error);
    setTenantsState((prev) => prev.map((t) => t.id === tenantId ? { ...t, contacts: (t.contacts || []).filter((c) => c.id !== contactId) } : t));
  };

  const updateTenantContacts = async (id, contacts) => {
    setTenantsState((prev) => prev.map((t) => t.id === id ? { ...t, contacts } : t));
  };

  const updateTenantIntent = async (id, intent) => updateTenant(id, { intent });

  const upsertPayment = async (data) => {
    const dbData = payAppToDb(data);
    const { data: upserted, error } = await supabase.from("payments").upsert([dbData], { onConflict: "tenant_id,month,year" }).select().single();
    if (error) throw sbErr(error);
    const mapped = payDbToApp(upserted);
    setPaymentsState((prev) => {
      const filtered = prev.filter((p) => !(p.tid === data.tid && p.month === data.month));
      return [mapped, ...filtered];
    });
    return mapped;
  };

  const deletePayment = async (tid, month) => {
    const year = new Date().getFullYear();
    const { error } = await supabase.from("payments").delete().eq("tenant_id", tid).eq("month", month).eq("year", year);
    if (error) throw sbErr(error);
    setPaymentsState((prev) => prev.filter((p) => !(p.tid === tid && p.month === month)));
  };

  const addContract = async (data) => {
    const { data: inserted, error } = await supabase.from("contracts").insert([data]).select().single();
    if (error) throw sbErr(error);
    setContractsState((prev) => [inserted, ...prev]);
    return inserted;
  };

  const updateContract = async (id, data) => {
    const { data: updated, error } = await supabase.from("contracts").update(data).eq("id", id).select().single();
    if (error) throw sbErr(error);
    setContractsState((prev) => prev.map((c) => c.id === id ? updated : c));
    return updated;
  };

  // AI 사용 횟수 체크
  const checkAiUsage = useCallback((feature) => {
    const plan = PLANS[userPlan || "free"] || PLANS.free;
    const limit = plan.limits[feature];
    if (limit === Infinity || limit === true) return { allowed: true, used: 0, limit: Infinity };
    if (!limit) return { allowed: false, used: 0, limit: 0 };
    const now = new Date();
    const usedCount = aiUsage.filter(u =>
      u.feature === feature &&
      u.year === now.getFullYear() &&
      u.month === now.getMonth() + 1
    ).length;
    return { allowed: usedCount < limit, used: usedCount, limit };
  }, [userPlan, aiUsage]);

  // AI 사용 기록
  const recordAiUsage = async (feature) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    const now = new Date();
    const { data } = await supabase.from("ai_usage").insert([{
      user_id: currentUser.id,
      feature,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    }]).select().single();
    if (data) setAiUsageState(prev => [...prev, data]);
  };

  const resetAllData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    const { data: myTenants } = await supabase.from("tenants").select("id").eq("user_id", currentUser.id);
    const myIds = (myTenants ?? []).map((t) => t.id);
    const tasks = [supabase.from("vacancies").delete().eq("user_id", currentUser.id)];
    if (myIds.length) {
      tasks.push(supabase.from("payments").delete().in("tenant_id", myIds));
      tasks.push(supabase.from("contracts").delete().in("tenant_id", myIds));
      tasks.push(supabase.from("tenants").delete().in("id", myIds));
    }
    const results = await Promise.all(tasks);
    const err = results.find((r) => r.error);
    if (err) throw sbErr(err.error);
    await loadAllData(currentUser.id);
  };

  return (
    <AppContext.Provider value={{
      tenants, payments, contracts, vacancies, loading,
      addTenant, updateTenant, deleteTenant,
      updateTenantContacts, updateTenantIntent,
      addContact, loadContacts, deleteContact,
      addVacancy, deleteVacancy, setVacancies,
      upsertPayment, deletePayment,
      addContract, updateContract,
      refreshData: loadAllData,
      resetAllData,
      setTenants: setTenantsState,
      setPayments: setPaymentsState,
      setContracts: setContractsState,
      user, userPlan, subscription, planLoading,
      canUse, getPlanLimit,
      checkAiUsage, recordAiUsage, aiUsage,
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
