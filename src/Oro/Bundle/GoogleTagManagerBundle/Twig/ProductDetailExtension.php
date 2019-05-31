<?php

namespace Oro\Bundle\GoogleTagManagerBundle\Twig;

use Oro\Bundle\GoogleTagManagerBundle\Provider\ProductDetailProvider;
use Oro\Bundle\ProductBundle\Entity\Product;
use Psr\Container\ContainerInterface;
use Symfony\Component\DependencyInjection\ServiceSubscriberInterface;
use Twig\TwigFunction;

/**
 * Provide twig functions to work with product details for GTM data layer
 */
class ProductDetailExtension extends \Twig_Extension implements ServiceSubscriberInterface
{
    /** @var ContainerInterface */
    private $container;

    /**
     * @param ContainerInterface $container
     */
    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    /**
     * @return array|TwigFunction[]
     */
    public function getFunctions()
    {
        return [
            new \Twig_SimpleFunction('oro_google_tag_manager_product_detail', [$this, 'getProductDetail']),
        ];
    }

    /**
     * @param mixed $product
     * @return array
     */
    public function getProductDetail($product): array
    {
        return $product instanceof Product
            ? $this->container->get(ProductDetailProvider::class)->getData($product)
            : [];
    }

    /**
     * {@inheritdoc}
     */
    public static function getSubscribedServices()
    {
        return [
            ProductDetailProvider::class
        ];
    }
}
