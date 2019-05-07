<?php

namespace Oro\Bundle\GoogleTagManagerBundle\Form\Type;

use Oro\Bundle\IntegrationBundle\Provider\TransportInterface;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class GoogleTagManagerSettingsType extends AbstractType
{
    /**
     * @var TransportInterface
     */
    private $transport;

    /**
     * @param TransportInterface $transport
     */
    public function __construct(TransportInterface $transport)
    {
        $this->transport = $transport;
    }

    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder->add(
            'containerId',
            TextType::class,
            [
                'label' => 'oro.google_tag_manager.settings.container_id.label',
                'tooltip' => 'oro.google_tag_manager.settings.container_id.description',
                'required' => true,
            ]
        );
    }

    /**
     * {@inheritdoc}
     */
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults(['data_class' => $this->transport->getSettingsEntityFQCN()]);
    }
}
