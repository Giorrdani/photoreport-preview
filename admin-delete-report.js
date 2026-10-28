document.addEventListener('submit', event => {
  const form = event.target.closest('form.delete-report-form');
  if (!form) return;
  const club = form.dataset.club || 'неизвестный клуб';
  const date = form.dataset.date || 'неизвестная дата';
  const confirmed = window.confirm(`Удалить отчёт клуба «${club}» за ${date}?\n\nОстатки проданных товаров будут восстановлены, а отчёт исключён из выручки. Действие нельзя отменить.`);
  if (!confirmed) event.preventDefault();
  else form.querySelector('button[type=submit]').disabled = true;
});
