'use client';
import { useState, useMemo, useEffect } from 'react';
import { normalizeId } from './data';

const STORAGE_KEY = 'selectedChildId';

/**
 * Resolves which children belong to this parent account.
 * Returns { children, selectedChildId, setSelectedChildId, selectedChild }
 * where `children` is an array of { studentId, name, class } objects.
 */
export function useChildSelection(userInfo, students) {
  const children = useMemo(() => {
    if (!userInfo || !students.length) return [];
    let rawIds = userInfo.studentIds;
    if (typeof rawIds === 'string') {
      try { rawIds = JSON.parse(rawIds); } catch { rawIds = rawIds ? [rawIds] : []; }
    }
    let linkedIds = Array.isArray(rawIds) ? rawIds.map(id => id.toString().trim()).filter(Boolean) : [];
    if (!linkedIds.length && userInfo.studentId) linkedIds = [userInfo.studentId.toString().trim()];
    if (!linkedIds.length) linkedIds = students.map(s => s.studentId.toString().trim());
    return linkedIds
      .map(id => {
        const nid = normalizeId(id);
        const match = students.find(s => normalizeId(s.studentId) === nid);
        return match ? { studentId: match.studentId, name: match.name, class: match.class } : { studentId: id, name: `Child (${id})`, class: '' };
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // alphabetical
  }, [userInfo, students]);

  const [selectedChildId, setSelectedChildIdRaw] = useState(null);

  // Init from localStorage or first child
  useEffect(() => {
    if (!children.length) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const valid = children.find(c => c.studentId === saved);
      setSelectedChildIdRaw(valid ? saved : children[0].studentId);
    } catch {
      setSelectedChildIdRaw(children[0].studentId);
    }
  }, [children.map(c => c.studentId).join(',')]);

  const setSelectedChildId = (id) => {
    setSelectedChildIdRaw(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  };

  const selectedChild = children.find(c => c.studentId === selectedChildId) || children[0] || null;

  return { children, selectedChildId, setSelectedChildId, selectedChild };
}
