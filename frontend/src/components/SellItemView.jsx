import React, { useState } from 'react';

const INITIAL_FORM = {
  title: '',
  category: '书籍',
  mode: 'BUY',
  price: '',
  stock: 1,
  condition: '几乎全新',
  description: '',
  pickupLocation: '',
  image: '',
  rentalRate: '',
  exchangeWish: '',
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&auto=format&fit=crop&q=80';

const FIELD_CLASS =
  'w-full rounded-field border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--meta)] hover:border-[var(--meta)] focus:border-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:ring-4 focus-visible:ring-[rgba(229,71,42,0.35)]';

function SellItemView({ onBack, onPublish, currentUser }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const updateField = (field, value) => {
    setError('');

    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('请选择有效的图片文件。');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5 MB。');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result;

      setImagePreview(imageData);
      updateField('image', imageData);
    };

    reader.onerror = () => {
      setError('图片读取失败，请重新选择。');
    };

    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview('');
    updateField('image', '');

    const fileInput = document.getElementById('item-image');

    if (fileInput) {
      fileInput.value = '';
    }
  };

  const validateForm = () => {
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.price ||
      !form.pickupLocation.trim()
    ) {
      return '请填写所有必填内容。';
    }

    if (Number(form.price) <= 0) {
      return '价格必须大于 0。';
    }

    if (Number(form.stock) < 1) {
      return '库存至少为 1。';
    }

    if (form.mode === 'RENT' && !form.rentalRate.trim()) {
      return '请填写租用价格。';
    }

    if (form.mode === 'EXCHANGE' && !form.exchangeWish.trim()) {
      return '请填写希望交换的内容。';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

   

if (!currentUser) {
  setError("请先登录后再发布商品。");
  return;
}

    setError('');
    setIsPublishing(true);

    const newProduct = {
      title: form.title.trim(),
      category: form.category,
      mode: form.mode,
      price: Number(form.price),
      stock: Math.max(1, Number(form.stock) || 1),
      originalPrice: null,
      condition: form.condition,
      description: form.description.trim(),
      pickupLocation: form.pickupLocation.trim(),
      image: form.image || FALLBACK_IMAGE,

      rentalRate:
        form.mode === 'RENT'
          ? form.rentalRate.trim()
          : '',

      exchangeWish:
        form.mode === 'EXCHANGE'
          ? form.exchangeWish.trim()
          : '',

      

      seller: {
        name:
          currentUser.name ||
          currentUser.fullName ||
          currentUser.email ||
          '校内卖家',

        email: currentUser.email || '',

        avatar:
          currentUser.avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',

        trustScore: currentUser.trustScore ?? 100,
        verified: currentUser.verified ?? false,
        department: currentUser.department || '校内卖家',
        reviews: 0,
        rating: 0,
      },

      createdAt: new Date().toISOString(),
    };

    try {
      await Promise.resolve(onPublish(newProduct));

      setForm(INITIAL_FORM);
      setImagePreview('');

      const fileInput = document.getElementById('item-image');

      if (fileInput) {
        fileInput.value = '';
      }
    } catch (publishError) {
      setError(
        publishError?.message || '发布失败，请稍后重试。'
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-8 lg:px-12">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-bold text-[var(--muted)] transition-colors hover:text-[var(--fg)] active:text-[var(--accent-active)]"
      >
        <span aria-hidden="true">←</span>
        返回集市
      </button>

      <div className="mb-8">
        <p className="eyebrow text-[var(--meta)]">河大同享 · 发布商品</p>
        <h1 className="mt-3 display-2 text-[var(--fg)]">发布校园闲置</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">填写商品信息，发布给金明、明伦校区的同学。</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="reveal space-y-7 rounded-panel border border-[var(--border-soft)] bg-[var(--bg)] p-5 shadow-card sm:p-8"
      >
        {error && (
          <div
            role="alert"
            className="rounded-field border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-[var(--danger)]"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="item-title" className="mb-2 block text-sm font-bold text-[var(--fg)]">
              商品名称 *
            </label>
            <input
              id="item-title"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="例如：高等数学教材"
              className={FIELD_CLASS}
              required
            />
          </div>

          <div>
            <label htmlFor="item-category" className="mb-2 block text-sm font-bold text-[var(--fg)]">
              商品分类 *
            </label>
            <select
              id="item-category"
              value={form.category}
              onChange={(event) => updateField('category', event.target.value)}
              className={FIELD_CLASS}
            >
              <option>书籍</option>
              <option>数码产品</option>
              <option>宿舍生活</option>
              <option>出行工具</option>
              <option>服饰鞋包</option>
              <option>学习用品</option>
              <option>其他</option>
            </select>
          </div>

          <div>
            <label htmlFor="listing-type" className="mb-2 block text-sm font-bold text-[var(--fg)]">
              交易方式 *
            </label>
            <select
              id="listing-type"
              value={form.mode}
              onChange={(event) => updateField('mode', event.target.value)}
              className={FIELD_CLASS}
            >
              <option value="BUY">出售</option>
              <option value="RENT">租用</option>
              <option value="EXCHANGE">交换</option>
            </select>
          </div>

          <div>
            <label htmlFor="item-price" className="mb-2 block text-sm font-bold text-[var(--fg)]">
              价格（元）*
            </label>
            <input
              id="item-price"
              type="number"
              min="1"
              step="0.01"
              value={form.price}
              onChange={(event) => updateField('price', event.target.value)}
              placeholder="例如：18"
              className={FIELD_CLASS}
              required
            />
          </div>

          <div>
            <label htmlFor="item-stock" className="mb-2 block text-sm font-bold text-[var(--fg)]">
              数量 *
            </label>
            <input
              id="item-stock"
              type="number"
              min="1"
              step="1"
              value={form.stock}
              onChange={(event) => updateField('stock', event.target.value)}
              placeholder="填写可售数量"
              className={FIELD_CLASS}
              required
            />
          </div>

          <div>
            <label htmlFor="item-condition" className="mb-2 block text-sm font-bold text-[var(--fg)]">
              成色 *
            </label>
            <select
              id="item-condition"
              value={form.condition}
              onChange={(event) => updateField('condition', event.target.value)}
              className={FIELD_CLASS}
            >
              <option>全新</option>
              <option>几乎全新</option>
              <option>成色良好</option>
              <option>一般</option>
              <option>需要维修</option>
            </select>
          </div>

          {form.mode === 'RENT' && (
            <div className="md:col-span-2">
              <label htmlFor="rental-rate" className="mb-2 block text-sm font-bold text-[var(--fg)]">
                租金（元/天）*
              </label>
              <input
                id="rental-rate"
                value={form.rentalRate}
                onChange={(event) => updateField('rentalRate', event.target.value)}
                placeholder="例如：每天 ¥5"
                className={FIELD_CLASS}
                required
              />
            </div>
          )}

          {form.mode === 'EXCHANGE' && (
            <div className="md:col-span-2">
              <label htmlFor="exchange-wish" className="mb-2 block text-sm font-bold text-[var(--fg)]">
                你想交换什么？*
              </label>
              <input
                id="exchange-wish"
                value={form.exchangeWish}
                onChange={(event) => updateField('exchangeWish', event.target.value)}
                placeholder="例如：想换一个科学计算器"
                className={FIELD_CLASS}
                required
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label htmlFor="item-description" className="mb-2 block text-sm font-bold text-[var(--fg)]">
              商品描述 *
            </label>
            <textarea
              id="item-description"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="描述商品的成色、瑕疵、配件和其他细节…"
              rows={5}
              className={`${FIELD_CLASS} resize-y`}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="pickup-location" className="mb-2 block text-sm font-bold text-[var(--fg)]">
              自提地点 *
            </label>
            <input
              id="pickup-location"
              value={form.pickupLocation}
              onChange={(event) => updateField('pickupLocation', event.target.value)}
              placeholder="例如：图书馆正门"
              className={FIELD_CLASS}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="item-image" className="mb-2 block text-sm font-bold text-[var(--fg)]">
              上传商品图片
            </label>
            <input
              id="item-image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full cursor-pointer rounded-field border border-dashed border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--fg-2)] transition-colors file:mr-4 file:cursor-pointer file:rounded-l-field file:border-0 file:bg-[var(--accent)] file:px-4 file:py-3 file:font-bold file:text-white hover:file:bg-[var(--accent-hover)]"
            />
            <p className="mt-2 text-xs text-[var(--meta)]">仅支持图片文件，大小不超过 5 MB。</p>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--fg)]">图片预览</span>

              {imagePreview && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="rounded-full px-2 py-1 text-xs font-bold text-[var(--danger)] transition-colors hover:text-danger-700 hover:underline active:text-danger-800"
                >
                  移除图片
                </button>
              )}
            </div>

            <div className="mt-2 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-panel border border-[var(--border-soft)] bg-[var(--surface)]">
              {imagePreview ? (
                <img src={imagePreview} alt="上传商品的预览" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <p className="px-5 text-center text-sm font-semibold text-[var(--meta)]">你上传的图片会显示在这里。</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-field border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
          <strong>演示说明：</strong> 图片目前以浏览器本地数据保存，后续会改为上传到后端存储。
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            className="press flex-1 rounded-full border border-[var(--border)] px-5 py-3 font-bold text-[var(--fg-2)] transition-colors hover:bg-[var(--surface)] active:bg-[var(--border-soft)]"
          >
            取消
          </button>

          <button
            type="submit"
            disabled={isPublishing}
            className="press flex-1 rounded-full bg-[var(--accent)] px-5 py-3 font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPublishing ? '正在发布…' : '发布商品'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default SellItemView;
