<?php

namespace Oro\Bundle\GoogleTagManagerBundle\Provider;

use Doctrine\ORM\EntityRepository;
use Oro\Bundle\CatalogBundle\Entity\Category;
use Oro\Bundle\CatalogBundle\Entity\Repository\CategoryRepository;
use Oro\Bundle\EntityBundle\ORM\DoctrineHelper;
use Oro\Bundle\LocaleBundle\Entity\Localization;
use Oro\Bundle\LocaleBundle\Provider\LocalizationProviderInterface;
use Oro\Bundle\ProductBundle\Entity\Product;

/**
 * Provide product detail for GTM data layer
 */
class ProductDetailProvider
{
    /** @var LocalizationProviderInterface */
    private $currentLocalizationProvider;

    /** @var DoctrineHelper */
    private $doctrineHelper;

    /** @var Category[][] */
    private $categoryPaths = [];

    /**
     * @param LocalizationProviderInterface $currentLocalizationProvider
     * @param DoctrineHelper $doctrineHelper
     */
    public function __construct(
        LocalizationProviderInterface $currentLocalizationProvider,
        DoctrineHelper $doctrineHelper
    ) {
        $this->currentLocalizationProvider = $currentLocalizationProvider;
        $this->doctrineHelper = $doctrineHelper;
    }

    /**
     * Get product detail for single Product entity
     *
     * @param Product $product
     * @param Localization|null $localization
     * @return array
     */
    public function getData(Product $product, Localization $localization = null): array
    {
        if (!$product->getSku()) {
            return [];
        }

        $localization = $localization ?? $this->currentLocalizationProvider->getCurrentLocalization();

        $name = $product->getName($localization);
        if (!$name || !$name->getString()) {
            return [];
        }

        $data = [
            'id' => $product->getSku(),
            'name' => $name->getString(),
        ];

        $brand = $product->getBrand();
        if ($brand) {
            $data['brand'] = $brand->getName($localization)->getString();
        }

        if (method_exists($product, 'getCategory') && $product->getCategory()) {
            $data['category'] = $this->getCategoryPath($product->getCategory(), $localization);
        }

        return array_filter($data);
    }

    /**
     * @param Category $category
     * @param null|Localization $localization
     * @return string
     */
    private function getCategoryPath(Category $category, ?Localization $localization): string
    {
        if (!isset($this->categoryPaths[$category->getId()])) {
            $this->categoryPaths[$category->getId()] = $this->getCategoryRepository()->getPath($category);
        }

        $parts = array_map(
            static function (Category $node) use ($localization) {
                return (string) $node->getTitle($localization);
            },
            $this->categoryPaths[$category->getId()]
        );

        return implode(' / ', $parts);
    }

    /**
     * @return CategoryRepository|EntityRepository
     */
    private function getCategoryRepository(): CategoryRepository
    {
        return $this->doctrineHelper->getEntityRepository(Category::class);
    }
}
