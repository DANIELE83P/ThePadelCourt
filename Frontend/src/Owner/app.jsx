/* eslint-disable react/prop-types */
import { MapPin, Euro, Edit, Trash2, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const Appp = ({ product, setEtit, openRemove, openDuplicate }) => {
  const { t } = useTranslation();
  const handleEdit = () => {
    setEtit(product);
  };

  return (
    <div className="ml-4 p-0 bg-gradient-to-br from-[var(--owner-card-bg)] to-[var(--owner-bg-secondary)] rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 mb-10 max-w-sm border border-[var(--owner-border)] overflow-hidden">
      <div className="relative">
        <img
          src={product.courtImg.url}
          className="w-full h-48 object-cover"
          alt={product.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <h2 className="absolute bottom-3 left-4 text-xl font-bold text-white drop-shadow-lg">{product.name}</h2>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <MapPin className="w-4 h-4 text-blue-400 mr-2" />
            <p className="text-sm font-semibold text-[var(--owner-text-secondary)] uppercase tracking-wide">{t('location')}</p>
          </div>
          <span className="text-base font-medium text-[var(--owner-text-primary)]">{product.location}</span>
        </div>

        <div className="mb-4">
          <p className="text-sm font-semibold text-[var(--owner-text-secondary)] uppercase tracking-wide mb-2">{t('operating_hours')}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--owner-text-muted)]">{t('from')}</span>
            <span className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 rounded-lg text-sm font-semibold">
              {product.operatingHours?.start} AM
            </span>
            <span className="text-xs text-[var(--owner-text-muted)]">{t('to')}</span>
            <span className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/50 text-purple-300 rounded-lg text-sm font-semibold">
              {product.operatingHours?.end} PM
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-5 p-3 bg-green-600/10 border border-green-500/30 rounded-lg">
          <p className="text-sm font-semibold text-[var(--owner-text-secondary)]">{t('price_per_hour')}:</p>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-green-400">
              {product.pricePerHour}
            </span>
            <Euro className="w-5 h-5 text-green-400" />
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <button
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg py-2.5 hover:from-blue-700 hover:to-blue-600 transition-all transform hover:scale-105 flex items-center justify-center text-sm font-medium shadow-md hover:shadow-lg"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4 mr-1.5" />
              {t('edit')}
            </button>
            <button
              className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg py-2.5 hover:from-red-700 hover:to-red-600 transition-all transform hover:scale-105 flex items-center justify-center text-sm font-medium shadow-md hover:shadow-lg"
              onClick={openRemove}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              {t('delete')}
            </button>
          </div>
          <button
            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg py-2.5 hover:from-green-700 hover:to-green-600 transition-all transform hover:scale-105 flex items-center justify-center text-sm font-medium shadow-md hover:shadow-lg"
            onClick={openDuplicate}
          >
            <Copy className="w-4 h-4 mr-1.5" />
            {t('duplicate')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Appp;
